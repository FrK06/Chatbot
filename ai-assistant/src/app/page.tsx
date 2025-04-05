// src/app/page.tsx
import Link from "next/link";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function Home() {
  const user = await getCurrentUser();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
          <div className="flex space-x-4">
            {isAuthenticated ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/chat" 
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Chat
                </Link>
                <Link
                  href="/api/logout"
                  className="bg-gray-100 text-gray-800 px-4 py-2 rounded hover:bg-gray-200"
                >
                  Logout
                </Link>
              </>
            ) : (
            // src/app/page.tsx - Update the login button
            <Link 
              href="/direct-login" 
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Login
            </Link>   
            )}
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-grow flex items-center justify-center bg-gray-50">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Your Personal AI Assistant
          </h2>
          <p className="mt-6 text-xl text-gray-500">
            Experience the power of AI with our advanced assistant powered by OpenAI's models.
            Ask questions, get summaries, and have natural conversations with your AI companion.
          </p>
          <div className="mt-12">
            <Link
              href={isAuthenticated ? "/chat" : "/direct-login"}
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-indigo-700"
            >
              {isAuthenticated ? "Start Chatting" : "Login to Start"}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} AI Assistant. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}