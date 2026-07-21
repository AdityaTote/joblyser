"use client";

import Link from "next/link";
import { GuestGuard } from "@/components/auth/AuthGuard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
    <div className="min-h-screen flex text-zinc-400 bg-[#0a0a0a] selection:bg-amber-400/30 selection:text-amber-200">
      {/* Left Column */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 border-r border-zinc-800 h-screen sticky top-0 flex-col p-8 lg:p-12 justify-between">
        <Link
          href="/"
          className="font-heading text-2xl font-bold text-amber-400 tracking-tight"
        >
          Joblyser.
        </Link>

        {/* Center Content: Testimonial & Benefits */}
        <div className="w-full max-w-md mx-auto flex flex-col gap-12">
          <div className="flex flex-col gap-6">
            <div className="font-heading text-6xl text-amber-400 opacity-50 leading-none h-8">
              &ldquo;
            </div>
            <div className="font-heading text-3xl lg:text-4xl leading-[1.2] text-white">
              I finally stopped guessing why I was getting rejected. Joblyser
              told me exactly which keywords my resume was missing.
            </div>
            <div className="flex flex-col mt-2">
              <span className="text-white font-medium">David Chen</span>
              <span className="text-sm text-zinc-500 font-mono uppercase tracking-widest mt-1">
                Landed role at Coinbase
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-8 border-t border-zinc-800">
            {[
              "Identify exact skill gaps instantly",
              "Generate custom cover letters",
              "Draft 1-click cold emails",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-4 text-zinc-400 text-sm"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M13.3334 4L6.00008 11.3333L2.66675 8"
                    stroke="#FBBF24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="text-zinc-500 italic text-sm">
          &ldquo;Know your gaps before they do.&rdquo;
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto min-h-screen">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
    </GuestGuard>
  );
}
