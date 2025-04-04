import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
// cookies' is declared but its value is never read.ts(6133)(alias) function cookies(): Promise<ReadonlyRequestCookies>import cookies
import { cookies } from "next/headers"; 

export async function GET() {
  const token = randomBytes(32).toString("hex");
  
  // Set the cookie in the response
  const response = NextResponse.json({ token });
  
  // Add the cookie to the response headers
  response.cookies.set("csrf_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600, // 1 hour
    path: "/",
  });
  
  return response;
}