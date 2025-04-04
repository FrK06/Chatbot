import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Paths that don't require authentication
const publicPaths = [
  "/api/auth/csrf",
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/session",
  "/api/auth/providers",
  "/api/auth/callback",
  "/api/auth/error",
  "/api/payment/webhook", // Stripe webhooks don't have auth
  "/api/health",
];

// Paths that don't require CSRF verification
const csrfExemptPaths = [
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/session",
  "/api/auth/providers",
  "/api/auth/callback",
  "/api/auth/error",
  "/api/payment/webhook",
  "/api/health",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for non-API routes
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  
  // Skip middleware for public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return addSecurityHeaders(NextResponse.next());
  }
  
  // For all other API routes, validate authentication
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // If not authenticated, return 401
  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // Validate CSRF token for mutating operations (POST, PUT, DELETE, PATCH)
  if (
    ["POST", "PUT", "DELETE", "PATCH"].includes(request.method) &&
    !csrfExemptPaths.some(path => pathname.startsWith(path))
  ) {
    const csrfToken = request.headers.get("x-csrf-token");
    const csrfCookie = request.cookies.get("csrf_token");
    
    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie.value) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
  }
  
  // All checks passed, continue with the request
  return addSecurityHeaders(NextResponse.next());
}

// Add security headers to all responses
function addSecurityHeaders(response: NextResponse) {
  // Set security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.stripe.com; frame-src https://*.stripe.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  return response;
}

// Configure middleware to run on all routes
export const config = {
  matcher: ["/api/:path*"],
};