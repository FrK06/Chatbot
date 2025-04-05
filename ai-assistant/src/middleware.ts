// src/middleware.ts
import { NextResponse, NextRequest } from "next/server";

// Public paths that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/direct-login",
  "/simple-test",
  "/api/direct-auth",
  "/api/simple-auth",
  "/api/debug-session",
  "/api/auth/csrf",
  "/api/health"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static assets and public paths
  if (
    pathname.startsWith('/_next/') || 
    pathname.includes('.') ||
    publicPaths.some(p => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return NextResponse.next();
  }
  
  // Check for session token
  const token = request.cookies.get("session-token");
  
  if (!token) {
    // No token found, redirect to login
    return NextResponse.redirect(new URL('/simple-test', request.url));
  }
  
  // Let the request continue - we'll let the API routes validate the token
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};