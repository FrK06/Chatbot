// src/app/direct-login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DirectLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

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
          router.push("/dashboard");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Direct Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500 text-white rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white p-2"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Test user: test@example.com / password123</p>
        </div>
        
        {status && (
          <div className="mt-4 p-3 bg-gray-900 text-gray-300 rounded text-xs">
            {status}
          </div>
        )}
        
        {/* Alternative login options */}
        <div className="mt-6 text-center">
          <Link href="/simple-test" className="text-indigo-400 hover:underline">
            Try simple login method
          </Link>
        </div>
      </div>
    </div>
  );
}