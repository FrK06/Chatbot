// src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/chat";
  const error = searchParams.get("error");

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  // If already authenticated, redirect to callbackUrl
  useEffect(() => {
    if (status === "authenticated") {
      console.log("Already authenticated, redirecting to:", callbackUrl);
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  // Function to get CSRF token
  const getCsrfToken = async () => {
    try {
      const response = await fetch("/api/auth/csrf");
      if (!response.ok) {
        throw new Error(`CSRF token fetch failed: ${response.status}`);
      }
      const data = await response.json();
      console.log("CSRF token obtained");
      return data.token;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      setDebugInfo(prev => prev + "\nCSRF token error: " + (error as Error).message);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted");
    setDebugInfo("Login form submitted");
    setIsLoading(true);
    setLoginError("");

    try {
      // Get CSRF token
      const csrfToken = await getCsrfToken();
      
      if (!csrfToken) {
        throw new Error("Could not obtain CSRF token");
      }
      
      setDebugInfo(prev => prev + "\nAttempting sign in with: " + email);
      console.log("Sign-in credentials:", { email, password: "********", csrfToken: csrfToken.substring(0, 5) + "..." });
      
      // Call NextAuth signIn method
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        csrfToken,
        callbackUrl
      });

      console.log("Sign in result:", result);
      setDebugInfo(prev => prev + "\nSign in result: " + JSON.stringify(result));

      if (result?.error) {
        setLoginError(result.error);
        setIsLoading(false);
        console.error("Login failed:", result.error);
      } else if (result?.url) {
        // Success - either let Next.js handle redirect or do it manually
        console.log("Login successful, redirecting to:", result.url);
        setDebugInfo(prev => prev + "\nRedirecting to: " + result.url);
        
        // Sometimes router.push doesn't trigger a redirect, so use direct location change as fallback
        setTimeout(() => {
          router.push(result.url || callbackUrl);
          
          // Fallback if router doesn't redirect
          setTimeout(() => {
            window.location.href = result.url || callbackUrl;
          }, 1000);
        }, 500);
      } else {
        // Unusual case - no error but no URL either
        console.warn("Unusual response from signIn:", result);
        setDebugInfo(prev => prev + "\nUnusual response: " + JSON.stringify(result));
        setIsLoading(false);
        
        // Try to redirect to callbackUrl anyway
        router.push(callbackUrl);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      setLoginError(errorMessage);
      setIsLoading(false);
      console.error("Login error:", error);
      setDebugInfo(prev => prev + "\nError: " + errorMessage);
      
      // If the error seems to be due to the credentials provider not being set up properly,
      // suggest trying direct login instead
      if (errorMessage.includes("CredentialsSignin") || errorMessage.includes("provider")) {
        setDebugInfo(prev => prev + "\nTry direct login at /direct-login instead");
      }
    }
  };

  // If loading or already authenticated, show loading state
  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          {(error || loginError) && (
            <div className="mt-2 p-2 text-center text-sm text-red-600 bg-red-100 rounded">
              {error === "CredentialsSignin" || loginError
                ? "Invalid email or password"
                : "An error occurred. Please try again."}
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Test user: test@example.com / password123</p>
          
          {/* Alternative link for direct login */}
          <p className="mt-2">
            <a 
              href="/direct-login" 
              className="text-indigo-400 hover:text-indigo-300"
            >
              Try direct login instead
            </a>
          </p>
        </div>
        
        {/* Debug information (helpful during development) */}
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-900 text-gray-300 rounded text-xs whitespace-pre-line">
            <strong>Debug Info:</strong>
            {debugInfo}
          </div>
        )}
      </div>
    </div>
  );
}