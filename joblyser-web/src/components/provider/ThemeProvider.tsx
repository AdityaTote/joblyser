"use client";

import * as React from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  resolvedTheme: ThemeMode;
  mounted: boolean;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [resolvedTheme, setResolvedTheme] = React.useState<ThemeMode>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem("joblyser-theme");
    setResolvedTheme(savedTheme === "dark" ? "dark" : "light");
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) {
      return;
    }

    const root = window.document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
    window.localStorage.setItem("joblyser-theme", resolvedTheme);
  }, [mounted, resolvedTheme]);

  const contextValue = React.useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme,
      mounted,
      setTheme: setResolvedTheme,
    }),
    [mounted, resolvedTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
