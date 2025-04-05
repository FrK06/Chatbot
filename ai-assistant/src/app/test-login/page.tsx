// src/app/test-login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TestLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState("");
  
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setResponse("Attempting direct login...");
    
    try {
      // Call your direct-auth endpoint
      const res = await fetch("/api/direct-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      
      if (res.ok && data.success) {
        setResponse(prev => prev + "\nLogin successful! Redirecting...");
        
        // Wait a bit to make sure cookie is set
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Test Direct Login</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500 text-white rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleDirectLogin} className="space-y-6">
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
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {isLoading ? "Logging in..." : "Direct Login"}
          </button>
        </form>
        
        {response && (
          <div className="mt-4 p-3 bg-gray-900 text-gray-300 rounded text-xs overflow-auto max-h-40">
            <pre>{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
}