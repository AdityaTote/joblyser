"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Globe, Lock, Mail, User, Zap } from "lucide-react";
import { useGoogleUrl, useSignUp } from "@/hooks/queries/useAuth";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signUpMutation = useSignUp();
  const googleMutation = useGoogleUrl();

  const isSubmitting = signUpMutation.isPending || googleMutation.isPending;
  const errorMessage =
    signUpMutation.error?.message || googleMutation.error?.message;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signUpMutation.mutate({ name, email, password });
  };

  const handleGoogleSignUp = () => {
    googleMutation.mutate();
  };

  return (
    <main className="min-h-[calc(100vh-2.25rem)]">
      <div className="px-8 py-7">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-[#7f838e]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </div>

      <div className="flex items-start justify-center px-4 pb-10 sm:px-6">
        <section className="w-full max-w-[320px] overflow-hidden rounded-[18px] border border-[#d6d7dc] bg-[#f7f7f8] shadow-[0_5px_16px_rgb(19_20_28/7%)]">
          <div className="px-3 pb-6 pt-5 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#15161e] text-white">
              <Zap className="h-4 w-4" />
            </div>
            <h1 className="mt-4 text-[39px] font-semibold text-[#15161d]">
              Create an account
            </h1>
            <p className="mt-1 text-[13px] text-[#888c96]">
              Join Joblyser and accelerate your career
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-xs font-semibold text-[#23252d]"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a2a6b0]" />
                  <input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="John Doe"
                    className="h-10 w-full rounded-[12px] border border-[#d7d8dd] bg-[#f5f5f6] pl-9 pr-3 text-sm outline-none placeholder:text-[#adb1ba] focus:border-[#c3c6d1]"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold text-[#23252d]"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a2a6b0]" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                    className="h-10 w-full rounded-[12px] border border-[#d7d8dd] bg-[#f5f5f6] pl-9 pr-3 text-sm outline-none placeholder:text-[#adb1ba] focus:border-[#c3c6d1]"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold text-[#23252d]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a2a6b0]" />
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-10 w-full rounded-[12px] border border-[#d7d8dd] bg-[#f5f5f6] pl-9 pr-3 text-sm outline-none focus:border-[#c3c6d1]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 w-full rounded-[12px] bg-[#12131b] text-sm font-semibold text-white"
              >
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </button>

              {errorMessage ? (
                <p className="rounded-[10px] border border-[#f3c2c6] bg-[#fdf1f2] px-3 py-2 text-xs font-medium text-[#be2f37]">
                  {errorMessage}
                </p>
              ) : null}

              <div className="relative py-1 text-center">
                <span className="relative z-10 bg-[#f7f7f8] px-2 text-[11px] text-[#9ea2ac]">
                  OR CONTINUE WITH
                </span>
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[#e0e1e6]" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isSubmitting}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-[#d7d8dd] bg-[#f7f7f8] text-sm font-semibold text-[#2a2d35]"
              >
                <Globe className="h-4 w-4" />
                Google
              </button>
            </form>
          </div>

          <div className="border-t border-[#dfdfe4] bg-[#f3f3f5] px-3 py-4 text-center text-sm text-[#888c96]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#1a1b22]">
              Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
