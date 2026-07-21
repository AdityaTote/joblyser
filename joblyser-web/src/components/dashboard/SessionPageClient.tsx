"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { History } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import SessionActionBar from "@/components/dashboard/session/SessionActionBar";
import SessionHistoryPanel from "@/components/dashboard/session/SessionHistoryPanel";
import SessionOutput from "@/components/dashboard/session/SessionOutput";
import type { AgentResult, SessionResponse } from "@/types";
import { useSessionHistory, useRunAgent, useJobStatus } from "@/hooks/queries/useAgent";

type SessionListItem = SessionResponse & {
  type: AgentResult["type"];
  timestamp: string;
  previewText: string;
};

export default function SessionPageClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const sessionId = params?.sessionId as string;
  
  const initialJobId = searchParams?.get("jobId");
  const [activeJobId, setActiveJobId] = useState<string | null>(initialJobId || null);

  const { data: sessionHistory, isLoading: isLoadingHistory } = useSessionHistory(sessionId);
  const runAgent = useRunAgent();
  const { data: jobStatus } = useJobStatus(activeJobId);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showMobileHistory, setShowMobileHistory] = useState(false);

  useEffect(() => {
    if (sessionHistory && sessionHistory.length > 0 && !activeSessionId) {
      setActiveSessionId(sessionHistory[0].id);
    }
  }, [sessionHistory, activeSessionId]);

  // Clean up URL parameters if we finish processing
  useEffect(() => {
    if (jobStatus && (jobStatus.status === "complete" || jobStatus.status === "completed" || jobStatus.status === "failed")) {
      setActiveJobId(null);
      if (initialJobId) {
        // Remove jobId from URL so a page refresh doesn't trigger it again
        router.replace(`/sessions/${sessionId}`);
      }
      queryClient.invalidateQueries({
        queryKey: ["agent", "session-history", sessionId],
      });
    }
  }, [jobStatus, sessionId, initialJobId, router, queryClient]);

  const activeSession = sessionHistory?.find((s) => s.id === activeSessionId) || null;

  const triggerAction = (actionId: string, label: string) => {
    if (!activeSession) return;
    runAgent.mutate(
      {
        action: actionId,
        user_query: `Run ${label}`,
        jd_text: activeSession.jd_text,
        doc_key: activeSession.doc_key,
        session_id: activeSession.session_id,
      },
      {
        onSuccess: (data) => {
          if (data.job_id) {
            setActiveJobId(data.job_id);
          }
        }
      }
    );
  };

  const sessions: SessionListItem[] = (sessionHistory || []).map((s) => {
    const type = s.agent_result?.type || "review";
    let previewText = "Generating result...";
    if (s.agent_result) {
      if (s.agent_result.type === "review") {
        previewText = s.agent_result.role_fit?.role_fit_summary?.slice(0, 60) + "..." || "Review completed.";
      } else if (s.agent_result.type === "cover_letter") {
        previewText = "Cover letter generated.";
      } else if (s.agent_result.type === "linkedin_note") {
        previewText = "LinkedIn note generated.";
      } else if (s.agent_result.type === "cold_mail") {
        previewText = "Cold email generated.";
      }
    }

    const date = new Date(s.created_at);
    let timestamp = "";
    if (!isNaN(date.getTime())) {
      timestamp = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return {
      ...s,
      type,
      timestamp,
      previewText,
    };
  });

  // Extract job title from the first review if possible, else default
  const reviewSession = sessionHistory?.find((s) => s.agent_result?.type === "review");
  let currentJobTitle = "Job Analysis Session";
  if (reviewSession && reviewSession.agent_result && reviewSession.agent_result.type === "review") {
    currentJobTitle = reviewSession.agent_result.what_is_job || currentJobTitle;
  }

  const isGenerating = runAgent.isPending || activeJobId !== null;

  return (
    <div className="h-full flex w-full overflow-hidden relative">
      {showMobileHistory && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setShowMobileHistory(false)}
        />
      )}

      <SessionHistoryPanel
        showMobileHistory={showMobileHistory}
        sessions={sessions}
        activeSessionId={activeSession?.id ?? null}
        currentJobTitle={currentJobTitle}
        onSelectSession={(session) => {
          setActiveSessionId(session.id);
          setShowMobileHistory(false);
        }}
        onCloseMobile={() => setShowMobileHistory(false)}
      />

      <div className="flex flex-col flex-1 bg-zinc-950 h-full w-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 lg:hidden">
          <h1 className="text-sm font-semibold text-white truncate">
            {currentJobTitle}
          </h1>
          <button
            onClick={() => setShowMobileHistory(true)}
            className="flex items-center gap-1 text-zinc-400 text-xs hover:text-white transition-colors"
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>

        <SessionOutput
          key={activeSession?.id ?? "empty"}
          activeSession={activeSession}
          isLoading={isGenerating || isLoadingHistory}
          activeAction={runAgent.variables?.action || null}
          onTriggerAction={triggerAction}
          onUpdateSession={(session) => {
            // Placeholder for now
          }}
        />

        <SessionActionBar
          isLoading={isGenerating}
          activeAction={runAgent.variables?.action || null}
          onTriggerAction={triggerAction}
        />
      </div>
    </div>
  );
}
