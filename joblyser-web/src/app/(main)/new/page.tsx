"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  FileText,
  Mail,
  Link as LinkIcon,
  Zap,
  ArrowRight,
  Star,
  Terminal,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/queries/useUser";

export default function NewSession() {
  const router = useRouter();
  const { data: user } = useUser();

  const handleNewSession = () => {
    router.push("/sessions/new");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="badge-blue mb-2"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              SYSTEM_READY: {user?.name?.split(" ")[0] || "GUEST"}
            </span>
          </motion.div>
          <h1 className="text-[24px]">
            Career <span className="text-brand">Dashboard</span>
          </h1>
        </div>
        <Button onClick={handleNewSession} className="btn-primary h-10 px-6">
          <PlusCircle className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px]">Quick Actions</h2>
              <p className="text-[10px] text-text3 font-mono uppercase tracking-widest">
                Available Tools
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  title: "JD Review",
                  desc: "Extract keywords & requirements",
                  icon: Zap,
                  badge: "badge-amber",
                  cmd: "--analyze",
                },
                {
                  title: "Cover Letter",
                  desc: "Generate tailored application letters",
                  icon: FileText,
                  badge: "badge-blue",
                  cmd: "--gen-cl",
                },
                {
                  title: "Cold Mail",
                  desc: "Craft high-conversion outreach",
                  icon: Mail,
                  badge: "badge-green",
                  cmd: "--gen-mail",
                },
                {
                  title: "LinkedIn Note",
                  desc: "Optimized connection requests",
                  icon: LinkIcon,
                  badge: "badge-blue",
                  cmd: "--gen-note",
                },
              ].map((action, i) => (
                <motion.div
                  key={i}
                  onClick={handleNewSession}
                  whileHover={{ y: -2 }}
                  className="premium-card cursor-pointer group bg-surface"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-surface2 border border-border rounded-[4px] flex items-center justify-center group-hover:border-brand/30 transition-colors">
                      <action.icon className="w-4 h-4 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] mb-0.5 group-hover:text-brand transition-colors truncate">
                        {action.title}
                      </h3>
                      <p className="text-[12px] text-text2 leading-snug line-clamp-1">
                        {action.desc}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[10px] font-mono text-text3">
                      {action.cmd}
                    </span>
                    <div className={cn(action.badge, "text-[9px]")}>Tool</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="premium-card bg-surface border-brand/20 relative overflow-hidden group">
            <div className="absolute inset-0 grid-bg opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none" />
            <div className="flex flex-col md:flex-row items-center gap-6 relative">
              <div className="w-12 h-12 bg-brand/5 border border-brand/10 rounded-[4px] flex items-center justify-center">
                <Star className="w-6 h-6 text-brand" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-[16px] mb-1">Unlock Premium AI Analysis</h3>
                <p className="text-[13px] text-text2 max-w-md">
                  Advanced models, unlimited sessions, and priority support.
                </p>
              </div>
              <Button className="btn-primary h-9 px-6 text-[11px]">
                Upgrade Now
              </Button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <Card className="premium-card bg-surface2/30 border-dashed">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-[14px]">System Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text2">Weekly Sessions</span>
                  <span className="font-mono text-brand font-bold">12/20</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: "60%" }} />
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text2">Assets Generated</span>
                  <span className="font-mono text-brand font-bold">28/50</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: "56%" }} />
                </div>
              </div>
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-[11px] text-text3 font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                  <span>ALL SYSTEMS OPERATIONAL</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card bg-brand/5 border-brand/10">
            <CardHeader className="p-0 mb-2">
              <CardTitle className="text-[13px] flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-brand" />
                Optimization Tip
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-[12px] text-text2 leading-relaxed">
                Tailoring your LinkedIn connection note increases response rates
                by <span className="text-brand font-mono font-bold">300%</span>.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
