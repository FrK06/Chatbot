// src/types/next-auth.d.ts
import "next-auth";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

// Extend the User type
interface IUser extends DefaultUser {
  tier?: string;
}

// Extend the Session type
declare module "next-auth" {
  interface User extends IUser {}
  
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tier: string;
    } & DefaultSession["user"];
  }
}

// Extend the JWT type
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tier: string;
  }
}