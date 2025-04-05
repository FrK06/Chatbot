// src/app/api/debug-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("session-token")?.value;
  
  // Define the type with optional tokenData and error fields
  const authInfo: {
    hasToken: boolean;
    tokenLength: number;
    tokenStart: string;
    cookieHeaders: string | null;
    validToken: boolean;
    tokenData: JWTPayload | null;
    error?: string;  // Make error optional
  } = {
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenStart: token ? token.substring(0, 10) + "..." : "none",
    cookieHeaders: request.headers.get("cookie"),
    validToken: false,
    tokenData: null  // Initialize as null but allow JWTPayload
  };
  
  if (token) {
    try {
      const secret = new TextEncoder().encode(
        process.env.NEXTAUTH_SECRET || "fallback_secret_change_this_in_production"
      );
      
      const { payload } = await jwtVerify(token, secret);
      authInfo.validToken = true;
      authInfo.tokenData = payload;
    } catch (error) {
      authInfo.error = (error as Error).message;
    }
  }
  
  return NextResponse.json(authInfo);
}