// src/app/login/simple/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SimpleLoginPage() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse("");

    try {
      console.log("Signing in with:", { email, password });
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password
      });

      console.log("Sign in result:", result);
      setResponse(JSON.stringify(result, null, 2));

      if (result?.error) {
        setError(result.error);
      } else if (result?.url) {
        // Optional: manually navigate instead of relying on redirect
        window.location.href = result.url;
      }
    } catch (err: any) {
      console.error("Sign in error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Simple Login Test</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {response && (
          <div className="mt-4">
            <h2 className="text-lg font-medium">Response:</h2>
            <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto text-xs">
              {response}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}