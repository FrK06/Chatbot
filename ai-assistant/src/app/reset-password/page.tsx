"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPasswordStrength } from "@/lib/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);

  // Update password strength when password changes
  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: "" });
    }
  }, [password]);

  // Check if token is provided
  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (passwordStrength.score < 3) {
      setError("Please choose a stronger password. " + passwordStrength.feedback);
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          passwordConfirm: confirmPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      
      setSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/direct-login?passwordReset=true");
      }, 3000);
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Reset Your Password</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500 text-white rounded">
            {error}
          </div>
        )}
        
        {success ? (
          <div className="text-center">
            <div className="mb-4 p-3 bg-green-500 text-white rounded">
              Your password has been reset successfully!
            </div>
            <p className="text-gray-300 mb-4">
              Redirecting you to the login page...
            </p>
            <Link 
              href="/direct-login" 
              className="text-blue-400 hover:underline"
            >
              Go to login page
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-gray-300 mb-4">
              Enter your new password below.
            </p>
            
            <div>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md bg-gray-700 border-gray-600 text-white p-4"
                  placeholder="New password (min 8 characters)"
                  required
                  minLength={8}
                  disabled={!token || isLoading}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  disabled={!token || isLoading}
                >
                  {passwordVisible ? "🔒" : "👁️"}
                </button>
              </div>
              
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Password strength:</span>
                    <span className="text-xs font-medium" style={{ 
                      color: passwordStrength.score < 2 ? 'red' : 
                             passwordStrength.score < 4 ? 'yellow' : 'green' 
                    }}>
                      {passwordStrength.feedback}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${(passwordStrength.score / 6) * 100}%`,
                        backgroundColor: passwordStrength.score < 2 ? 'red' : 
                                       passwordStrength.score < 4 ? 'yellow' : 'green'
                      }}
                    />
                  </div>
                  <ul className="mt-1 text-xs text-gray-400 space-y-1">
                    <li className={password.length >= 8 ? "text-green-400" : ""}>
                      ✓ At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? "text-green-400" : ""}>
                      ✓ At least one uppercase letter
                    </li>
                    <li className={/[a-z]/.test(password) ? "text-green-400" : ""}>
                      ✓ At least one lowercase letter
                    </li>
                    <li className={/[0-9]/.test(password) ? "text-green-400" : ""}>
                      ✓ At least one number
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full rounded-md bg-gray-700 border-gray-600 text-white p-4"
                placeholder="Confirm new password"
                required
                disabled={!token || isLoading}
              />
              
              {password && confirmPassword && (
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-3">
                  {password === confirmPassword ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-red-400">✗</span>
                  )}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!token || isLoading}
              className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
            >
              {isLoading ? "Resetting password..." : "Reset Password"}
            </button>
            
            <div className="mt-4 text-center">
              <Link href="/direct-login" className="text-blue-400 hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}