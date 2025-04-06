// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcrypt";
import { signupSchema, formatZodErrors } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      const formattedErrors = formatZodErrors(validation.error.format());
      return NextResponse.json(
        { error: "Invalid input", message: formattedErrors, details: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validation.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }
    
    // Hash the password (10 rounds is a good default)
    const hashedPassword = await hash(password, 10);
    
    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tier: "FREE", // Default tier for new users
      },
    });
    
    // Return success with safe user data (no password)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tier: user.tier,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}