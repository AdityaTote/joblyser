"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Briefcase,
  Mail,
  Lock,
  Globe,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";
import { useSignIn, useGoogleUrl } from "@/hooks/queries/useAuth";
import { Loader2 } from "lucide-react";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: signIn, isPending, error } = useSignIn();
  const { mutate: getGoogleUrl, isPending: googlePending } = useGoogleUrl();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signIn({ email, password });
  };

  const handleGoogleLogin = () => {
    getGoogleUrl();
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-[0.04] pointer-events-none" />
      <div className="absolute inset-0 bg-linear-to-b from-brand/4 via-transparent to-transparent pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-brand rounded-[4px] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Joblyser
            </span>
          </Link>
        </div>

        <Card className="premium-card bg-surface border-border shadow-md">
          <CardHeader className="space-y-1 pt-2 pb-6 text-center">
            <CardTitle className="text-[20px]">Welcome Back</CardTitle>
            <CardDescription className="text-[13px] text-text2">
              Sign in to continue your AI-powered search.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Button
              variant="outline"
              className="btn-ghost w-full h-10 gap-3 bg-surface2/40 hover:bg-surface2"
              onClick={handleGoogleLogin}
              disabled={googlePending || isPending}
            >
              {googlePending ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
              ) : (
                <Globe className="h-4 w-4 text-brand" />
              )}
              Continue with Google
            </Button>


            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-mono">
                <span className="bg-surface px-3 text-text3">OR_EMAIL</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="grid gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text2 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text3" />
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    className="input-field pl-10 w-full h-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-text2 uppercase tracking-wider">
                    Password
                  </label>
                  <Button
                    variant="link"
                    className="text-[10px] p-0 h-auto text-text3 hover:text-brand font-mono"
                  >
                    FORGOT_PASS?
                  </Button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text3" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="input-field pl-10 w-full h-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="text-red-500 text-[12px] font-mono p-2 bg-red-500/10 border border-red-500/20 rounded-[4px]">
                  [ERROR] {(error as any)?.message || "Authentication failed"}
                </div>
              )}
              <Button type="submit" className="btn-primary w-full h-10 mt-2" disabled={isPending || googlePending}>
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="mr-2 w-4 h-4" />
                )}
                Sign In
              </Button>

            </form>
          </CardContent>
          <CardFooter className="pb-6 pt-4 flex justify-center border-t border-border bg-surface2/30">
            <p className="text-[12px] text-text2">
              New to Joblyser?{" "}
              <Link
                href="/signup"
                className="text-brand hover:underline font-semibold"
              >
                Create Account
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="mt-6 text-center text-[10px] text-text3 px-8 leading-relaxed font-mono">
          [AUTH_NOTICE] Secure login powered by Joblyser AI.
        </p>
      </motion.div>
    </div>
  );
}
