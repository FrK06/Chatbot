"use client";

// src/app/components/theme-toggle.tsx
import { useTheme } from "../providers/theme-provider";
import { Sun, Moon, Laptop } from "lucide-react";
import { useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const selectTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    closeDropdown();
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Toggle theme"
      >
        {theme === "light" && <Sun size={20} className="text-yellow-500" />}
        {theme === "dark" && <Moon size={20} className="text-blue-400" />}
        {theme === "system" && <Laptop size={20} />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeDropdown}
            aria-hidden="true"
          ></div>
          <div className="absolute right-0 z-50 mt-2 w-36 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <button
                onClick={() => selectTheme("light")}
                className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                  theme === "light"
                    ? "bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-200"
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <Sun size={16} />
                <span>Light</span>
              </button>
              <button
                onClick={() => selectTheme("dark")}
                className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                  theme === "dark"
                    ? "bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-200"
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <Moon size={16} />
                <span>Dark</span>
              </button>
              <button
                onClick={() => selectTheme("system")}
                className={`flex w-full items-center gap-2 px-4 py-2 text-sm ${
                  theme === "system"
                    ? "bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-200"
                } hover:bg-gray-100 dark:hover:bg-gray-700`}
              >
                <Laptop size={16} />
                <span>System</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}