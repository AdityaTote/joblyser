"use client";

import { ReactNode } from "react";
import { TanstackProvider } from "./TanstackProvider";

export function Provider({ children }: { children: ReactNode }) {
  return <TanstackProvider>{children}</TanstackProvider>;
}
