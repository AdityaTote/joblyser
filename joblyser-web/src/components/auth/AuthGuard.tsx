"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";

/**
 * Wraps dashboard routes – redirects to /signin when there is no valid session.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  const storedUser = useStore((s) => s.user);
  const hasToken = !!storedUser?.access_token;

  useEffect(() => {
    if (hydrated && !hasToken) {
      router.replace("/signin");
    }
  }, [hydrated, hasToken, router]);

  // Show spinner until hydration completes
  if (!hydrated || !hasToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <span className="text-sm text-zinc-500">Loading…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Wraps auth routes (signin / signup) – redirects to /new when already logged in.
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const storedUser = useStore((s) => s.user);
  const hasToken = !!storedUser?.access_token;

  useEffect(() => {
    if (hydrated && hasToken) {
      router.replace("/new");
    }
  }, [hydrated, hasToken, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (hasToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <span className="text-sm text-zinc-500">Redirecting…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
