"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // This is a placeholder - implement actual password reset functionality
      // For now, just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSubmitted(true);
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Reset Password</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500 text-white rounded">
            {error}
          </div>
        )}
        
        {isSubmitted ? (
          <div className="text-center">
            <div className="mb-4 p-3 bg-green-500 text-white rounded">
              Password reset instructions have been sent to your email.
            </div>
            <p className="text-gray-300 mb-4">
              Please check your inbox and follow the instructions to reset your password.
            </p>
            <Link 
              href="/direct-login" 
              className="text-blue-400 hover:underline"
            >
              Return to login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-300 mb-4">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md bg-gray-700 border-gray-600 text-white p-4"
                  placeholder="Email address"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isLoading ? "Submitting..." : "Reset Password"}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <Link 
                href="/direct-login" 
                className="text-blue-400 hover:underline"
              >
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}