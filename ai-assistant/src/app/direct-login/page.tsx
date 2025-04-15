"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function DirectLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/chat';
  const errorType = searchParams.get('error');
  const isRegistered = searchParams.get('registered') === 'true';
  const isReset = searchParams.get('reset') === 'success';

  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Set error message based on URL parameter
  useEffect(() => {
    if (errorType) {
      let errorMessage = "";
      switch (errorType) {
        case "google":
          errorMessage = "Google authentication failed. This might be due to incorrect configuration or permission issues.";
          break;
        case "CredentialsSignin":
          errorMessage = "Invalid email or password.";
          break;
        case "SessionRequired":
          errorMessage = "You need to be logged in to access that page.";
          break;
        default:
          errorMessage = `Authentication error: ${errorType}`;
      }
      setError(errorMessage);
    }

    if (isRegistered) {
      setStatus("Account created successfully! Please log in.");
    }

    if (isReset) {
      setStatus("Your password has been reset successfully!");
    }
  }, [errorType, isRegistered, isReset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setStatus("Submitting login...");

    try {
      const response = await fetch("/api/direct-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || "Failed to log in");
        setStatus(`Login failed: ${data.error || "Unknown error"}`);
      } else {
        // Successfully logged in
        setStatus("Login successful! Redirecting...");
        
        // Give time for cookies to be set
        setTimeout(() => {
          router.push(callbackUrl);
        }, 1000);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      setStatus(`Error: ${errorMessage}`);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // This will be connected to the NextAuth Google provider
    window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Direct Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500 text-white rounded">
            {error}
          </div>
        )}

        {status && !error && (
          <div className="mb-4 p-3 bg-green-500 text-white rounded">
            {status}
          </div>
        )}
        
        <p className="text-gray-300 mb-4 text-sm">
          Only login via email, Google, or +86 phone number login is supported in your region.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-4"
              placeholder="Phone number / email address"
              required
            />
          </div>
          
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-4"
              placeholder="Password"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              aria-label="Show password"
            >
              👁️
            </button>
          </div>
          
          <p className="text-sm text-gray-400">
            By signing up or logging in, you consent to AI Assistant's{" "}
            <Link href="/terms" className="text-blue-400 hover:underline">Terms of Use</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
          </p>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        
        <div className="mt-4 flex justify-between">
          <Link href="/forgot-password" className="text-blue-400 text-sm hover:underline">
            Forgot password?
          </Link>
          <Link href="/signup" className="text-blue-400 text-sm hover:underline">
            Sign up
          </Link>
        </div>
        
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">OR</span>
          </div>
        </div>
        
        <button
          onClick={handleGoogleLogin}
          className="mt-6 w-full bg-gray-700 text-white p-3 rounded-md hover:bg-gray-600 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" className="mr-2">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Log in with Google
        </button>
        
        {errorType === 'google' && (
          <div className="mt-3 text-xs text-yellow-300">
            <p>Google login may fail if:</p>
            <ul className="list-disc pl-5 mt-1">
              <li>The redirect URI in Google Cloud Console doesn't match your current URL</li>
              <li>You're using a different port (e.g., 3001 instead of 3000)</li>
              <li>Your NEXTAUTH_URL in .env doesn't match your current URL</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}