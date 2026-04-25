"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/provider/ThemeProvider";

export function ThemeToggle() {
  const { mounted, resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      className="top-icon-button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {!mounted ? (
        <Sun className="h-4 w-4" />
      ) : resolvedTheme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}
