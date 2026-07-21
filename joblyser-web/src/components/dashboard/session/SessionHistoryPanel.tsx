import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import { getBadge } from "@/components/dashboard/session/badges";
import type { AgentResult } from "@/types";

interface SessionHistoryItemBase {
  id: string;
  type: AgentResult["type"];
  timestamp: string;
  previewText: string;
}

interface SessionHistoryPanelProps<T extends SessionHistoryItemBase> {
  showMobileHistory: boolean;
  sessions: T[];
  activeSessionId: string | null;
  currentJobTitle: string;
  onSelectSession: (session: T) => void;
  onCloseMobile: () => void;
}

export default function SessionHistoryPanel<T extends SessionHistoryItemBase>({
  showMobileHistory,
  sessions,
  activeSessionId,
  currentJobTitle,
  onSelectSession,
  onCloseMobile,
}: SessionHistoryPanelProps<T>) {
  return (
    <div
      className={`${
        showMobileHistory ? "flex fixed inset-y-0 left-0 z-40" : "hidden"
      } lg:static lg:flex flex-col w-72 shrink-0 bg-zinc-950 border-r border-zinc-800 h-full p-4 overflow-y-auto transition-transform`}
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-3 lg:mb-0">
          <Link
            href="/new"
            className="flex items-center gap-1.5 text-zinc-400 text-sm hover:text-white transition-colors w-max"
          >
            <ArrowLeft className="w-4 h-4" />
            Sessions
          </Link>
          <button
            className="lg:hidden text-zinc-400 hover:text-white p-1"
            onClick={onCloseMobile}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <h2 className="text-white text-sm font-semibold lg:mt-3 truncate">
          {currentJobTitle}
        </h2>
        <div className="border-b border-zinc-800 mt-3 mb-4" />

        <div className="text-zinc-500 text-xs uppercase tracking-widest mb-3">
          History
        </div>
        <div className="flex flex-col">
          {sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`border rounded-xl px-3 py-3 mb-2 cursor-pointer transition-all ${
                  isActive
                    ? "border-amber-400/50 bg-zinc-900"
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  {getBadge(session.type)}
                  <span className="text-zinc-600 text-[10px]">
                    {session.timestamp}
                  </span>
                </div>
                <div className="text-zinc-400 text-xs mt-1.5 truncate leading-tight">
                  {session.previewText}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
