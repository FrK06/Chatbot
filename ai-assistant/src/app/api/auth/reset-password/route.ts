// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { passwordResetRequestSchema, passwordResetConfirmSchema } from "@/lib/validation";
import { hash } from "bcrypt";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Determine if this is a reset request or confirmation
    const isConfirmation = "token" in body && "password" in body;
    
    if (isConfirmation) {
      // This is a password reset confirmation
      const validation = passwordResetConfirmSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validation.error.format() },
          { status: 400 }
        );
      }
      
      const { token, password } = validation.data;
      
      // Find the user with this reset token
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: new Date() } // Token must not be expired
        }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "Invalid or expired reset token" },
          { status: 400 }
        );
      }
      
      // Hash the new password
      const hashedPassword = await hash(password, 10);
      
      // Update the user's password and clear the reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        }
      });
      
      return NextResponse.json({ success: true });
    } else {
      // This is a password reset request
      const validation = passwordResetRequestSchema.safeParse(body);
      
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid input", details: validation.error.format() },
          { status: 400 }
        );
      }
      
      const { email } = validation.data;
      
      // Find the user
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      // For security reasons, don't reveal if the email exists or not
      if (!user) {
        // We return success even though no email was sent
        // This prevents email enumeration attacks
        return NextResponse.json({ success: true });
      }
      
      // Generate a reset token
      const token = randomBytes(32).toString("hex");
      const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
      
      // Store the token and expiry in the database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: token,
          resetTokenExpiry: tokenExpiry
        }
      });
      
      // Send the password reset email
      const emailSent = await sendPasswordResetEmail(email, token);
      
      if (!emailSent) {
        console.error(`Failed to send password reset email to ${email}`);
        // Don't expose email sending failure to the user
        // Just log it on the server
      }
      
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}