import Link from "next/link";
import { ArrowRight, Play, Zap } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

const partnerNames = ["Google", "Meta", "Amazon", "Stripe", "Airbnb"];

export default function LandingPage() {
  return (
    <main className="min-h-[calc(100vh-2.25rem)]">
      <header className="mx-auto flex h-14 w-full max-w-[940px] items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-semibold leading-none"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[#14151d] text-white">
            <Zap className="h-4 w-4" />
          </span>
          <span className="text-2xl">Joblyser</span>
        </Link>

        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-[#4d515a] transition hover:text-[#1a1b22]"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="rounded-full bg-[#14151d] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#0f1016]"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <section className="px-4 pb-16 pt-14 text-center sm:px-6">
        <div className="mx-auto w-full max-w-4xl">
          <p className="mx-auto inline-flex rounded-full border border-[#dbdce1] bg-[#ededf0] px-5 py-1 text-[11px] font-semibold tracking-[0.16em] text-[#757985]">
            AI-POWERED CAREER ACCELERATOR
          </p>

          <h1 className="mt-8 text-[44px] leading-[1.08] font-semibold tracking-[-0.02em] text-[#13141b] sm:text-[62px]">
            Land your dream job with
            <span className="block text-[#a0a3ad]">AI precision.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-[#777b86] sm:text-lg">
            Stop guessing what recruiters want. Analyze JDs, tailor your resume,
            and generate high-converting application assets in seconds.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[#13141c] px-7 py-3 text-[15px] font-semibold text-white"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[#d8d9de] bg-[#f3f3f5] px-7 py-3 text-[15px] font-semibold text-[#2a2d35]"
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e1e2e7] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#9da1ac]">
            TRUSTED BY SEEKERS HIRED AT
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-9 text-3xl font-semibold text-[#8d9099] sm:gap-12">
            {partnerNames.map((partner) => (
              <span key={partner}>{partner}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center sm:px-6">
        <h2 className="text-[55px] font-semibold tracking-[-0.02em] text-[#15161e] sm:text-[58px]">
          How Joblyser Works
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-base leading-7 text-[#7f838e] sm:text-lg">
          Three simple steps to transform your job application process and
          increase your interview rate.
        </p>
      </section>
    </main>
  );
}
