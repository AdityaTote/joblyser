"use client";

import { useState } from "react";
import Link from "next/link";
import AuthDivider from "@/components/auth/AuthDivider";
import AuthHeader from "@/components/auth/AuthHeader";
import AuthSocialButton from "@/components/auth/AuthSocialButton";
import { useSignIn } from "@/hooks/queries/useAuth";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>(
    {},
  );
  
  const signIn = useSignIn();
  const loading = signIn.isPending;

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.includes("@")) {
      newErrors.email = "Please enter a valid email address";
    }
    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    signIn.mutate(
      { email, password },
      {
        onError: (error) => {
          setErrors({ form: error.message || "Failed to sign in" });
        },
      }
    );
  };

  const isFormValid = email.includes("@") && password.length >= 8;

  return (
    <div className="flex flex-col">
      <AuthHeader
        label="Welcome back"
        title="Sign in to Joblyser"
        brandClassName="mb-12"
      />
      <AuthSocialButton label="Sign in with Google" />
      <AuthDivider text="or continue with email" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {errors.form && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">
            {errors.form}
          </div>
        )}
        <div>
          <label className="text-zinc-400 text-sm mb-1.5 block">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            placeholder="you@example.com"
            className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="text-zinc-400 text-sm mb-1.5 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password)
                setErrors({ ...errors, password: undefined });
            }}
            placeholder="••••••••"
            className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password}</p>
          )}

          <div className="flex justify-end mt-2">
            <Link
              href="#"
              className="text-zinc-400 hover:text-amber-400 text-sm transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="bg-amber-400 text-black font-semibold hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-xl w-full py-3 transition-all flex justify-center items-center h-[52px] mt-2"
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="text-center text-zinc-500 text-sm mt-8">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
