"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPasswordStrength } from "@/lib/validation";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/direct-login";
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setStatus("Creating your account...");

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setStatus("");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setStatus("");
      setIsLoading(false);
      return;
    }
    
    // Advanced password validation
    if (passwordStrength.score < 3) {
      setError("Please choose a stronger password. " + passwordStrength.feedback);
      setStatus("");
      setIsLoading(false);
      return;
    }

    try {
      // Call our signup API endpoint
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        let errorMessage = data.error || "Registration failed";
        
        // Handle specific error cases
        if (response.status === 409) {
          errorMessage = "This email is already registered. Please log in instead.";
        } else if (data.details) {
          // Format Zod validation errors
          const formattedErrors = Object.entries(data.details)
            .map(([field, errors]: [string, any]) => {
              if (errors && errors._errors) {
                return `${field}: ${errors._errors.join(", ")}`;
              }
              return null;
            })
            .filter(Boolean)
            .join("; ");
          
          if (formattedErrors) {
            errorMessage = formattedErrors;
          }
        }
        
        setError(errorMessage);
        setStatus("");
      } else {
        // Success - redirect to login page with success message
        setStatus("Account created successfully! Redirecting to login...");
        
        // Redirect after a short delay to allow the user to see the success message
        setTimeout(() => {
          router.push(`${callbackUrl}?registered=true&email=${encodeURIComponent(email)}`);
        }, 1500);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setError("Network error. Please check your connection and try again.");
      setStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Create an Account</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500 text-white rounded">
            {error}
          </div>
        )}
        
        {status && (
          <div className="mb-4 p-3 bg-green-500 text-white rounded">
            {status}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md bg-gray-700 border-gray-600 text-white p-4"
              placeholder="Full name"
              required
            />
          </div>
          
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
          
          <div>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-gray-700 border-gray-600 text-white p-4"
                placeholder="Password (min 8 characters)"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
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
              placeholder="Confirm password"
              required
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
          
          <p className="text-sm text-gray-400">
            By signing up, you consent to AI Assistant's{" "}
            <Link href="/terms" className="text-blue-400 hover:underline">Terms of Use</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.
          </p>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isLoading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-300">
            Already have an account?{" "}
            <Link 
              href="/direct-login" 
              className="text-blue-400 hover:underline"
            >
              Log in
            </Link>
          </p>
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
          onClick={() => window.location.href = "/api/auth/signin/google"}
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
          Sign up with Google
        </button>
      </div>
    </div>
  );
}