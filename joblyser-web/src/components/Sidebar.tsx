"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PlusCircle,
  MessageSquare,
  History,
  User,
  Settings,
  LogOut,
  Briefcase,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { useSessions } from "@/hooks/queries/useAgent";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useStore();
  const { data: sessions = [] } = useSessions();

  const handleNewSession = () => {
    router.push("/sessions/new");
  };

  return (
    <aside className="w-64 border-r border-border bg-surface flex flex-col h-full z-20">
      <div className="p-5 flex flex-col h-full">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand rounded-[8px] flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-medium tracking-tight">Joblyser</span>
        </Link>

        <Button
          onClick={handleNewSession}
          className="btn-primary w-full justify-center gap-2 mb-8 h-10"
        >
          <PlusCircle className="w-4 h-4" />
          New Session
        </Button>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-[11px] font-medium text-text3 uppercase tracking-widest">
              Recent Activity
            </p>
            <History className="w-3 h-3 text-text3" />
          </div>

          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-1">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className={cn(
                    "nav-pill-item flex items-center gap-3 w-full",
                    pathname === `/sessions/${session.id}`
                      ? "active"
                      : "text-text2 hover:bg-surface2",
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="truncate">{session.id.substring(0, 8)}</span>
                </Link>
              ))}
              {sessions.length === 0 && (
                <div className="px-3 py-8 text-center border border-dashed border-border rounded-[8px] bg-surface2/30">
                  <Terminal className="w-6 h-6 text-text3 mx-auto mb-2" />
                  <p className="text-[11px] text-text3">No sessions yet.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <Link
            href="/user/profile"
            className="flex items-center gap-3 p-2 rounded-[8px] hover:bg-surface2 transition-colors border border-transparent hover:border-border"
          >
            <div className="w-9 h-9 rounded-[6px] bg-surface2 border border-border flex items-center justify-center overflow-hidden">
              {user?.name ? (
                <span className="text-[13px] font-medium text-brand">
                  {user.name.charAt(0)}
                </span>
              ) : (
                <User className="w-4 h-4 text-text2" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-text1 truncate">
                {user?.name || "Guest User"}
              </p>
              <p className="text-[11px] text-text3 truncate uppercase tracking-wider">
                Settings
              </p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
