import { RefreshCw } from "lucide-react";

interface SessionActionBarProps {
  isLoading: boolean;
  activeAction: string | null;
  onTriggerAction: (actionId: string, label: string) => void;
}

export default function SessionActionBar({
  isLoading,
  activeAction,
  onTriggerAction,
}: SessionActionBarProps) {
  return (
    <div className="bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 px-4 sm:px-6 py-4 flex-shrink-0 z-10 w-full overflow-x-auto scrollbar-hide">
      <div className="flex flex-row items-center justify-between gap-4 w-full min-w-max pb-1">
        <span className="text-zinc-500 text-sm hidden lg:block">
          Run another action
        </span>
        <div className="flex gap-3">
          {[
            { id: "review", label: "📊 Review" },
            { id: "cover_letter", label: "📄 Cover Letter" },
            { id: "cold_mail", label: "📧 Cold Email" },
            { id: "linkedin_note", label: "🤝 LinkedIn" },
          ].map((action) => {
            const isRunning = activeAction === action.label;
            return (
              <button
                key={action.id}
                onClick={() => onTriggerAction(action.id, action.label)}
                disabled={isLoading}
                className={`whitespace-nowrap border text-sm rounded-xl px-4 py-2 font-medium transition-all flex items-center gap-2 ${
                  isRunning
                    ? "bg-amber-400/10 border-amber-400 text-amber-400 cursor-wait"
                    : "border-zinc-700 text-zinc-300 hover:border-amber-400 hover:text-amber-400 disabled:opacity-50 disabled:hover:border-zinc-700 disabled:hover:text-zinc-300 disabled:cursor-not-allowed"
                }`}
              >
                {isRunning && <RefreshCw className="w-4 h-4 animate-spin" />}
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
