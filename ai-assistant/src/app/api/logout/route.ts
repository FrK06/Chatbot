// src/app/api/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Clear the session cookie
  const cookieStore = cookies();
  cookieStore.delete("session-token");
  
  // Return success
  return NextResponse.json({ success: true });
}

export async function GET() {
  // Clear the session cookie
  const cookieStore = cookies();
  cookieStore.delete("session-token");
  
  // Redirect to home page
  return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}