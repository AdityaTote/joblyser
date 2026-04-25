"use client";

import { ReactNode } from "react";
import { TanstackProvider } from "./TanstackProvider";
import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "@/components/ui/sonnet";

export function Provider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TanstackProvider>
        {children}
        <Toaster richColors position="top-right" />
      </TanstackProvider>
    </ThemeProvider>
  );
}
