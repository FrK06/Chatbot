// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcrypt";
import type { NextAuthOptions } from "next-auth";

// For TypeScript: Define the user type we return
interface UserWithTier {
  id: string;
  email: string;
  name?: string | null;
  tier: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          tier: "FREE", // Default tier for new Google users
        };
      },
    }),
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
        
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          
          if (!user || !user.password) {
            return null;
          }
          
          const isPasswordValid = await compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            return null;
          }
          
          // Return user with explicitly defined type
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: user.tier || "FREE",
          } as UserWithTier;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/direct-login",
    error: "/direct-login?error=true",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tier = token.tier as string || "FREE";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = (user as UserWithTier).tier || "FREE";
      }
      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };