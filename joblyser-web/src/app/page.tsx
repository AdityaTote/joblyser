"use client";

import * as React from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Moon,
  Sun,
  Layout,
  FileSearch,
  PenTool,
  Users,
  Terminal,
} from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "@/components/theme-provider";

export default function LandingPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand rounded-[8px] flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium tracking-tight">Joblyser</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text2">
            <a href="#features" className="hover:text-brand transition-colors">
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-brand transition-colors"
            >
              How it works
            </a>
            <a href="#pricing" className="hover:text-brand transition-colors">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-[8px] border border-border bg-surface2 text-text2 hover:bg-surface3"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
            <Link
              href="/signin"
              className="hidden sm:block text-[13px] font-medium text-text2 hover:text-brand transition-colors"
            >
              Login
            </Link>
            <Link href="/signup" className={buttonVariants({ variant: "default" })}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-[0.03] dark:opacity-[0.07] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="badge-blue mb-6">
              <span className="flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                v2.0.4-STABLE
              </span>
            </div>
            <h1 className="mb-6 text-[32px] md:text-[48px]">
              Automate your job search with{" "}
              <span className="text-brand">Developer Precision</span>
            </h1>
            <p className="text-[15px] text-text2 mb-10 max-w-lg leading-relaxed">
              The AI-powered productivity platform for job seekers. Analyze JDs,
              tailor resumes, and generate application assets with a single
              command.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className={cn(buttonVariants({ variant: "default" }), "btn-primary h-11 px-8 text-[13px]")}>
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Button
                variant="outline"
                className="btn-secondary h-11 px-8 text-[13px]"
              >
                Documentation
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="terminal-card shadow-2xl">
              <div className="terminal-header">
                <div className="terminal-dot bg-red" />
                <div className="terminal-dot bg-amber" />
                <div className="terminal-dot bg-green" />
                <span className="ml-4 text-[11px] text-text3 opacity-50">
                  joblyser --analyze jd.txt
                </span>
              </div>
              <div className="p-6 text-[12px] leading-relaxed">
                <div className="flex gap-4 mb-4">
                  <span className="text-green">✔</span>
                  <span className="text-text1">
                    Job Description parsed successfully.
                  </span>
                </div>
                <div className="flex gap-4 mb-4">
                  <span className="text-brand">ℹ</span>
                  <span className="text-text1">
                    Analyzing match against{" "}
                    <span className="text-brand">resume.pdf</span>...
                  </span>
                </div>
                <div className="pl-8 space-y-2 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-text2">Technical Skills Match</span>
                    <span className="text-green">92%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill w-[92%]" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text2">Experience Alignment</span>
                    <span className="text-amber">74%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill w-[74%] bg-amber" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-brand">➜</span>
                  <span className="text-text1">
                    Generating tailored{" "}
                    <span className="text-brand">cover_letter.md</span>...
                  </span>
                </div>
                <div className="mt-6 pt-4 border-t border-[#1E293B] flex justify-between items-center">
                  <span className="text-text3 text-[10px]">
                    READY FOR EXPORT
                  </span>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                    <span className="text-brand text-[10px]">LISTENING</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        className="py-24 bg-surface2 border-y border-border relative"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <div className="text-brand font-mono text-[11px] mb-4 uppercase tracking-[0.2em]">
              Core Capabilities
            </div>
            <h2 className="mb-4">Everything you need to stand out</h2>
            <p className="text-text2 max-w-xl">
              Built for developers who value speed and precision. No fluff, just
              the tools you need to land your next role.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "JD Analysis",
                desc: "Deep parsing of job descriptions to extract keywords, requirements, and hidden preferences.",
                icon: FileSearch,
                badge: "badge-blue",
                status: "Ready",
              },
              {
                title: "Asset Generation",
                desc: "Tailored cover letters, cold emails, and LinkedIn notes optimized for conversion.",
                icon: PenTool,
                badge: "badge-green",
                status: "Stable",
              },
              {
                title: "Resume Matching",
                desc: "Real-time scoring of your resume against any JD with actionable improvement tips.",
                icon: Layout,
                badge: "badge-amber",
                status: "Active",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="premium-card flex flex-col gap-6 bg-surface"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-surface2 border border-border rounded-[4px] flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-brand" />
                  </div>
                  <div className={feature.badge}>{feature.status}</div>
                </div>
                <div>
                  <h3 className="mb-3">{feature.title}</h3>
                  <p className="text-text2 leading-relaxed text-[13px]">
                    {feature.desc}
                  </p>
                </div>
                <div className="mt-auto pt-4 border-t border-border flex items-center gap-2 text-[11px] text-text3 font-mono">
                  <Terminal className="w-3 h-3" />
                  <span>
                    joblyser --{feature.title.toLowerCase().replace(" ", "-")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-[8px] flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium tracking-tight">Joblyser</span>
          </div>
          <p className="text-[12px] text-text3">
            © 2024 Joblyser. Built for developers.
          </p>
          <div className="flex gap-8 text-[13px] text-text2 font-medium">
            <a href="#" className="hover:text-brand transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-brand transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-brand transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
