// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import { redis } from "@/lib/redis";

// Define custom types
interface LoginCredentials {
  email: string;
  password: string;
  csrfToken?: string;
}

// Define your custom user type including tier
interface CustomUser {
  id: string;
  email: string;
  name?: string | null;
  tier: string;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      // Define the credentials schema (for TypeScript)
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Cast credentials to our custom type
        const creds = credentials as unknown as LoginCredentials;
        console.log("Authorize function called with credentials:", creds);
        
        if (!creds?.email || !creds?.password) {
          console.log("Missing email or password");
          return null;
        }

        try {
          // Apply rate limiting for login attempts
          const loginKey = `login-attempts:${creds.email}`;
          const attempts = await redis.incr(loginKey);
          
          // Set key to expire after 1 hour on first attempt
          if (attempts === 1) {
            await redis.expire(loginKey, 3600);
          }
          
          // Rate limit to 5 attempts per hour
          if (attempts > 5) {
            console.log("Too many login attempts");
            throw new Error("Too many login attempts. Please try again later.");
          }

          const user = await prisma.user.findUnique({
            where: { email: creds.email },
          });

          console.log("User found:", user ? "yes" : "no");

          if (!user || !user.password) {
            console.log("User not found or has no password");
            return null;
          }

          const isPasswordValid = await compare(
            creds.password, 
            user.password
          );

          console.log("Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("Password invalid");
            return null;
          }
          
          // Reset login attempts on successful login
          await redis.del(loginKey);

          console.log("Authentication successful for:", user.email);
          
          // Return user object as CustomUser
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: user.tier,
          } as CustomUser;
        } catch (error) {
          console.error("Error in authorize function:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log("JWT callback called", { hasUser: !!user });
      
      if (user) {
        // We need to cast the user to our custom type
        const customUser = user as CustomUser;
        
        // Add custom claims to token
        token.id = customUser.id;
        token.tier = customUser.tier;
        token.email = customUser.email;
        token.name = customUser.name;
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback called");
      
      // Add claims to the session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tier = token.tier as string;
      }
      
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },
  debug: true, // Set to true to see detailed error messages
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };