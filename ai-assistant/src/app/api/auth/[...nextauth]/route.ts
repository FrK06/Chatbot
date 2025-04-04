// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcrypt";
import { JWT } from "next-auth/jwt";
import type { NextAuthOptions } from "next-auth";
import { redis } from "@/lib/redis";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days - increasing for better persistence
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Apply rate limiting for login attempts
        const loginKey = `login-attempts:${credentials.email}`;
        const attempts = await redis.incr(loginKey);
        
        // Set key to expire after 1 hour on first attempt
        if (attempts === 1) {
          await redis.expire(loginKey, 3600);
        }
        
        // Rate limit to 5 attempts per hour
        if (attempts > 5) {
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password, 
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }
        
        // Reset login attempts on successful login
        await redis.del(loginKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) {
        // Add custom claims to token
        token.id = user.id;
        token.tier = user.tier;
        token.email = user.email;
        token.name = user.name;
        token.jti = crypto.randomUUID(); // Add unique token ID for revocation
      }
      
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      // Add claims to the session
      session.user.id = token.id;
      session.user.tier = token.tier;
      session.user.email = token.email;
      session.user.name = token.name;
      
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login?error=true",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };