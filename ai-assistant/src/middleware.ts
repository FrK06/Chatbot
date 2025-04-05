// src/middleware.ts
import { NextResponse, NextRequest } from "next/server";

// Public paths that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/direct-login",
  "/forgot-password",
  "/signup",
  "/api/direct-auth",
  // NextAuth paths - IMPORTANT: ensure all of these are included
  "/api/auth",
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/session",
  "/api/auth/providers",
  "/api/auth/callback",
  "/api/auth/csrf",
  "/api/auth/error",
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
    return NextResponse.redirect(new URL('/direct-login', request.url));
  }
  
  // Let the request continue - we'll let the API routes validate the token
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api/auth/* (NextAuth.js paths)
     * 2. /_next/* (Next.js internals)
     * 3. /static/* (static files)
     * 4. .*\..*$ (files with extensions)
     */
    '/((?!_next/|static/|.*\\..*$).*)',
  ],
};