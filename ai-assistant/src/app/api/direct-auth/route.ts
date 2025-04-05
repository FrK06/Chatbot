// src/app/api/direct-auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcrypt";
import { prisma } from "@/lib/db";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";

// Simple schema for login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the request body
    const body = await request.json();
    
    // 2. Validate the input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { email, password } = validation.data;
    
    // 3. Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // 4. Verify the password
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    
    // 5. Create a simple session token
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || "fallback_secret_change_this_in_production"
    );
    
    const token = await new SignJWT({ 
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.tier
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);
    
    // 6. Set the session cookie - FIX: Add await here
    const cookieStore = await cookies();
    cookieStore.set("session-token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    // 7. Return success with user info
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}