"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import { Loader2, Terminal, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const name = searchParams.get("name");

    console.log("Auth Callback Params:", { token, userId, email, name });

    if (token && userId && email) {
      setUser({
        id: userId,
        email: email,
        name: name || email.split("@")[0],
        access_token: token,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Brief delay for visual confirmation
      const timer = setTimeout(() => {
        router.push("/new");
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // If params are missing, redirect to login with error
      console.error("Missing auth params in callback");
      router.push("/signin?error=callback_failed");
    }
  }, [searchParams, setUser, router]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-16 h-16 bg-brand/10 border border-brand/20 rounded-full flex items-center justify-center"
        >
          <div className="w-10 h-10 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
          <Terminal className="absolute inset-0 m-auto w-5 h-5 text-brand animate-pulse" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -right-1 -bottom-1 bg-surface border border-brand/30 rounded-full p-1"
        >
          <CheckCircle2 className="w-4 h-4 text-green" />
        </motion.div>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Signing you in...</h1>
        <p className="text-text3 font-mono text-[12px] uppercase tracking-widest">
          [SYSTEM] Initializing Session Context
        </p>
      </div>

      <div className="w-48 progress-track">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="progress-fill" 
        />
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-[0.03] pointer-events-none" />
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
          <p className="text-text3 font-mono text-[10px]">LOADING_CONTEXT...</p>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
