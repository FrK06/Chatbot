// src/app/simple-test/page.tsx
"use client";

import { useState, useEffect } from "react";

export default function SimpleTestPage() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [status, setStatus] = useState("Ready");
  const [token, setToken] = useState("");
  const [userData, setUserData] = useState(null);

  // Check if we already have a token in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("test_token");
    if (storedToken) {
      setToken(storedToken);
      setStatus("Token found in storage");
    }
  }, []);

  // Simple login function
  const handleLogin = async () => {
    setStatus("Logging in...");
    
    try {
      const response = await fetch("/api/simple-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      setStatus(`Response: ${JSON.stringify(data)}`);
      
      if (data.token) {
        localStorage.setItem("test_token", data.token);
        setToken(data.token);
        setUserData(data.user);
        setStatus("Login successful!");
      } else {
        setStatus(`Login failed: ${data.error || "Unknown error"}`);
      }
    } catch (error: unknown) {
      // Properly type the error
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      } else {
        setStatus(`Error: ${String(error)}`);
      }
    }
  };

  // Simple logout function
  const handleLogout = () => {
    localStorage.removeItem("test_token");
    setToken("");
    setUserData(null);
    setStatus("Logged out");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Ultra Simple Authentication Test</h1>
        
        {!token ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 text-green-800 rounded-md">
              <p className="font-bold">Logged In</p>
              {userData && (
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        )}
        
        <div className="mt-6 p-3 bg-gray-100 rounded-md">
          <div className="font-bold">Status:</div>
          <div className="text-sm break-words">{status}</div>
        </div>
      </div>
    </div>
  );
}