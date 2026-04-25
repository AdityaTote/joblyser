"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  FileText,
  Info,
  Landmark,
  ListChecks,
  ShieldCheck,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  useEditChat,
  useJobStatus,
  useRunAgent,
  useSession,
  useSessionHistory,
} from "@/hooks/queries/useAgent";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/queries/useUser";
import { useStore } from "@/store/useStore";
import { AgentResult, SessionResponse } from "@/types/api";

const actionButtons = [
  { key: "review", label: "Review", icon: Zap },
  { key: "cover_letter", label: "Cover Letter", icon: FileText },
  { key: "cold_mail", label: "Cold Mail", icon: FileText },
  { key: "linkedin_note", label: "LinkedIn", icon: FileText },
] as const;

type ActionKey = (typeof actionButtons)[number]["key"];

function asActionKey(value: string | null): ActionKey | null {
  if (!value) {
    return null;
  }

  const normalized = value as ActionKey;
  return actionButtons.some((action) => action.key === normalized)
    ? normalized
    : null;
}

function getActionLabel(action: ActionKey): string {
  switch (action) {
    case "cover_letter":
      return "Cover Letter";

    case "cold_mail":
      return "Cold Mail";

    case "linkedin_note":
      return "LinkedIn";

    case "review":
      return "Review";
  }
}

function getLatestSessionForAction(
  history: SessionResponse[],
  fallbackSession: SessionResponse | null,
  action: ActionKey,
): SessionResponse | null {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const item = history[index];
    if (item.agent_result?.type === action) {
      return item;
    }
  }

  if (fallbackSession?.agent_result?.type === action) {
    return fallbackSession;
  }

  return null;
}

function getSessionTimestamp(item: SessionResponse): string {
  return item.updated_at || item.created_at;
}

function formatHistoryTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toActionKeyFromResultType(
  resultType: AgentResult["type"],
): ActionKey | null {
  if (
    resultType === "review" ||
    resultType === "cover_letter" ||
    resultType === "cold_mail" ||
    resultType === "linkedin_note"
  ) {
    return resultType;
  }

  return null;
}

function normalizeSidebarText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([.!?])(\S)/g, "$1 $2")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function renderOutputContent(
  result: AgentResult | null | undefined,
  action?: ActionKey,
): string {
  if (!result) {
    if (action) {
      const label = getActionLabel(action);
      return `No ${label} output yet. Run ${label} to generate it.`;
    }

    return "No generated output yet. Run one of the actions above to start analysis.";
  }

  if (result.type === "review") {
    const companySummary = result.search_company?.summary
      ? `Company: ${result.search_company.summary}`
      : "";

    return [result.role_fit.role_fit_summary, companySummary]
      .filter(Boolean)
      .join("\n\n");
  }

  if (result.type === "apply_note") {
    return result.application_note;
  }

  if (result.type === "cover_letter") {
    const letter = result.cover_letter;
    return (
      letter.edited_text ||
      `${letter.header.date}\n\n${letter.body.paragraph_1_hook}\n\n${letter.body.paragraph_2_proof}\n\n${letter.body.paragraph_3_company_fit}\n\n${letter.body.paragraph_4_complete_picture}\n\n${letter.body.paragraph_5_cta}\n\n${letter.sign_off.closing},\n${letter.sign_off.candidate_name}`
    );
  }

  if (result.type === "linkedin_note") {
    return result.linkedin_note.edited_text || result.linkedin_note.note;
  }

  if (result.type === "cold_mail") {
    return (
      result.cold_mail.edited_text ||
      `Subject: ${result.cold_mail.subject}\n\n${result.cold_mail.email_body}`
    );
  }

  return "Unsupported output type.";
}

function getOutputTitle(resultType: AgentResult["type"]): string {
  switch (resultType) {
    case "review":
      return "JD Analysis & Match Score";

    case "cover_letter":
      return "Cover Letter";

    case "cold_mail":
      return "Cold Mail";

    case "linkedin_note":
      return "LinkedIn Note";

    default:
      return "Application Note";
  }
}

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useStore();
  const { data: profile } = useUser();
  const initialAction = asActionKey(searchParams.get("format")) || "review";

  const sessionIdParam = params.sessionId;
  const sessionId = Array.isArray(sessionIdParam)
    ? sessionIdParam[0]
    : sessionIdParam;
  const isServerSession = Boolean(sessionId) && sessionId !== "new";

  const [selectedAction, setSelectedAction] =
    useState<ActionKey>(initialAction);
  const [currentJobId, setCurrentJobId] = useState<string | null>(
    searchParams.get("jobId"),
  );
  const [pendingAction, setPendingAction] = useState<ActionKey | null>(
    searchParams.get("jobId") ? initialAction : null,
  );
  const [pendingHistoryLength, setPendingHistoryLength] = useState<
    number | null
  >(null);
  const [pendingLatestSignature, setPendingLatestSignature] = useState<
    string | null
  >(null);
  const [isAwaitingLatestResult, setIsAwaitingLatestResult] = useState(
    Boolean(searchParams.get("jobId")),
  );
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null,
  );
  const [draftByChatId, setDraftByChatId] = useState<Record<string, string>>(
    {},
  );
  const handledJobStatusRef = useRef<string | null>(null);

  const {
    data: session,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useSession(sessionId || "");
  const {
    data: sessionHistory = [],
    isLoading: historyLoading,
    refetch: refetchSessionHistory,
  } = useSessionHistory(sessionId || "");
  const runAgent = useRunAgent();
  const editChat = useEditChat();
  const { data: jobStatus } = useJobStatus(currentJobId);

  const buildHistorySignature = (
    item?: SessionResponse | null,
  ): string | null => {
    if (!item) {
      return null;
    }

    return `${item.id}:${item.updated_at || item.created_at}:${item.agent_result?.type || "none"}`;
  };

  useEffect(() => {
    if (!isAwaitingLatestResult || pendingLatestSignature !== null) {
      return;
    }

    const latestHistoryItem =
      sessionHistory[sessionHistory.length - 1] || session || null;
    const nextSignature = buildHistorySignature(latestHistoryItem);

    const timeoutId = window.setTimeout(() => {
      setPendingLatestSignature(nextSignature);
      setPendingHistoryLength(sessionHistory.length);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAwaitingLatestResult, pendingLatestSignature, session, sessionHistory]);

  useEffect(() => {
    const normalized = String(jobStatus?.status || "").toLowerCase();

    if (!normalized || handledJobStatusRef.current === normalized) {
      return;
    }

    let timeoutId: number | null = null;

    if (normalized === "failed") {
      handledJobStatusRef.current = normalized;
      timeoutId = window.setTimeout(() => {
        setCurrentJobId(null);
        setIsAwaitingLatestResult(false);
        setPendingAction(null);
        setPendingHistoryLength(null);
        setPendingLatestSignature(null);
      }, 0);
      toast.error("Analysis job failed");
    } else if (normalized === "complete" || normalized === "completed") {
      handledJobStatusRef.current = normalized;
      timeoutId = window.setTimeout(() => {
        setIsAwaitingLatestResult(true);
      }, 0);
      void refetchSession();
      void refetchSessionHistory();
      toast.success("Analysis completed");
    }

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [jobStatus?.status, refetchSession, refetchSessionHistory]);

  const latestSession =
    sessionHistory[sessionHistory.length - 1] || session || null;
  const historySource =
    sessionHistory.length > 0 ? sessionHistory : session ? [session] : [];
  const sessionHistoryWithActions = historySource
    .filter(
      (
        item,
      ): item is SessionResponse & {
        agent_result: AgentResult;
      } => Boolean(item.agent_result),
    )
    .slice()
    .sort((left, right) => {
      const leftTime = new Date(getSessionTimestamp(left)).getTime();
      const rightTime = new Date(getSessionTimestamp(right)).getTime();
      return rightTime - leftTime;
    });
  const selectedHistorySession = selectedHistoryId
    ? historySource.find((item) => item.id === selectedHistoryId) || null
    : null;
  const selectedActionSession = getLatestSessionForAction(
    sessionHistory,
    session || null,
    selectedAction,
  );
  const selectedSession = selectedHistorySession || selectedActionSession;
  const selectedResult = selectedSession?.agent_result || null;
  const displayContextSession = selectedSession || latestSession;

  const roleTitle = searchParams.get("title") || "Target Role";
  const company = searchParams.get("company") || "Target Company";
  const userQuery =
    displayContextSession?.user_query ||
    searchParams.get("query") ||
    "Focus on my strongest matching experience.";
  const jdText =
    displayContextSession?.jd_text ||
    "No job description found in this session yet. Run a new analysis from the dashboard.";
  const sidebarJdText = normalizeSidebarText(jdText);

  const outputContent = renderOutputContent(selectedResult, selectedAction);
  const displayResultType: AgentResult["type"] =
    selectedResult?.type ?? selectedAction;
  const isReviewResult = displayResultType === "review";
  const outputTitle = getOutputTitle(displayResultType);

  const activeChatId = selectedSession?.id || "";
  const editedOutput = draftByChatId[activeChatId] ?? outputContent;

  const editableOutputType =
    selectedResult?.type === "cover_letter" ||
    selectedResult?.type === "cold_mail" ||
    selectedResult?.type === "linkedin_note";

  const canSaveEditedOutput =
    editableOutputType &&
    isServerSession &&
    Boolean(activeChatId) &&
    editedOutput.trim().length > 0 &&
    editedOutput !== outputContent &&
    !editChat.isPending;

  const matchScore =
    selectedResult?.type === "review"
      ? selectedResult.role_fit.match_score
      : null;
  const decision =
    selectedResult?.type === "review" ? selectedResult.role_fit.decision : null;
  const confidence =
    selectedResult?.type === "review"
      ? selectedResult.role_fit.confidence
      : null;
  const matchedRequirements =
    selectedResult?.type === "review"
      ? selectedResult.role_fit.matched_requirements.map(
          (item) => item.requirement,
        )
      : [];
  const skillGaps =
    selectedResult?.type === "review"
      ? selectedResult.role_fit.unmatched_requirements.map(
          (item) => item.requirement,
        )
      : [];
  const decisionConditions =
    selectedResult?.type === "review"
      ? selectedResult.role_fit.decision_conditions
      : [];

  const normalizedJobStatus = String(jobStatus?.status || "").toLowerCase();
  const isJobActive =
    Boolean(currentJobId) &&
    normalizedJobStatus !== "complete" &&
    normalizedJobStatus !== "completed" &&
    normalizedJobStatus !== "failed";

  const latestHistoryItem =
    sessionHistory[sessionHistory.length - 1] || session || null;
  const latestHistorySignature = buildHistorySignature(latestHistoryItem);
  const hasNewHistoryEntry =
    pendingHistoryLength !== null &&
    sessionHistory.length > pendingHistoryLength;
  const hasUpdatedLatestSignature =
    !!latestHistorySignature &&
    !!pendingLatestSignature &&
    latestHistorySignature !== pendingLatestSignature;
  const hasExpectedOutputType =
    !!latestHistoryItem?.agent_result &&
    (!pendingAction || latestHistoryItem.agent_result.type === pendingAction);
  const hasSyncedExpectedOutput =
    hasExpectedOutputType && (hasNewHistoryEntry || hasUpdatedLatestSignature);
  const isAwaitingOutputSync =
    isAwaitingLatestResult &&
    normalizedJobStatus !== "failed" &&
    !hasSyncedExpectedOutput;

  const isAnalyzing = runAgent.isPending || isJobActive || isAwaitingOutputSync;

  const activeJobStatus =
    jobStatus?.status ||
    (runAgent.isPending
      ? "dispatching"
      : isAwaitingLatestResult
        ? "syncing"
        : "idle");

  const loadingHeadline =
    runAgent.isPending && !currentJobId
      ? "Submitting Request..."
      : normalizedJobStatus === "pending" || normalizedJobStatus === "queued"
        ? "Queuing Request..."
        : normalizedJobStatus === "complete" ||
            normalizedJobStatus === "completed"
          ? "Syncing Latest Output..."
          : "Processing Analysis...";

  const pendingActionLabel = pendingAction
    ? getActionLabel(pendingAction)
    : "Analysis";

  const jobStatusLabel = isAnalyzing ? activeJobStatus : "idle";

  useEffect(() => {
    if (!isAwaitingLatestResult) {
      return;
    }

    const isJobComplete =
      normalizedJobStatus === "complete" || normalizedJobStatus === "completed";
    if (!isJobComplete) {
      return;
    }

    if (!hasNewHistoryEntry && !hasSyncedExpectedOutput) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCurrentJobId(null);
      setIsAwaitingLatestResult(false);
      setPendingAction(null);
      setPendingHistoryLength(null);
      setPendingLatestSignature(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [
    hasNewHistoryEntry,
    hasSyncedExpectedOutput,
    isAwaitingLatestResult,
    normalizedJobStatus,
  ]);

  const handleRunAction = (action: ActionKey) => {
    setSelectedAction(action);
    setSelectedHistoryId(null);

    setPendingAction(action);
    setPendingHistoryLength(sessionHistory.length);
    setPendingLatestSignature(buildHistorySignature(latestHistoryItem));
    setIsAwaitingLatestResult(true);

    const docKey =
      latestSession?.doc_key ||
      profile?.primary_resume_key ||
      profile?.resume_key ||
      user?.primary_resume_key ||
      user?.resume_key ||
      "";

    if (!latestSession?.jd_text?.trim()) {
      toast.error("No job description found for this session");
      return;
    }

    if (!docKey) {
      toast.error("No resume is linked to this session");
      return;
    }

    runAgent.mutate(
      {
        action,
        user_query:
          latestSession.user_query ||
          `Generate a ${action.replace("_", " ")} output`,
        jd_text: latestSession.jd_text,
        doc_key: docKey,
        session_id: isServerSession ? sessionId : undefined,
      },
      {
        onSuccess: (data) => {
          handledJobStatusRef.current = null;

          if (data.job_id) {
            setCurrentJobId(data.job_id);
          } else {
            setIsAwaitingLatestResult(false);
            setPendingAction(null);
            setPendingHistoryLength(null);
            setPendingLatestSignature(null);
          }

          if (!isServerSession && data.session_id) {
            router.replace(`/session/${data.session_id}?format=${action}`);
          }

          toast.success("Analysis started");
        },
        onError: (error) => {
          setCurrentJobId(null);
          setIsAwaitingLatestResult(false);
          setPendingAction(null);
          setPendingHistoryLength(null);
          setPendingLatestSignature(null);
          toast.error(error.message);
        },
      },
    );
  };

  const handleSaveEditedOutput = () => {
    if (!sessionId || !activeChatId) {
      return;
    }

    editChat.mutate(
      {
        chatId: activeChatId,
        sessionId,
        editedText: editedOutput,
      },
      {
        onSuccess: () => {
          setDraftByChatId((previous) => {
            const updated = { ...previous };
            delete updated[activeChatId];
            return updated;
          });

          void refetchSession();
          void refetchSessionHistory();
          toast.success("Edited output saved");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(editedOutput);
      toast.success("Output copied to clipboard");
    } catch {
      toast.error("Could not copy output");
    }
  };

  const handleDownloadOutput = () => {
    const blob = new Blob([editedOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `joblyser-${sessionId || "session"}-${selectedAction}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex min-h-[calc(100vh-2.25rem)] flex-col bg-app text-app lg:flex-row">
      <aside className="w-full border-b border-(--app-line) bg-(--app-surface-soft) px-4 py-5 lg:h-[calc(100vh-2.25rem)] lg:w-66 lg:shrink-0 lg:border-b-0 lg:border-r lg:py-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-(--app-muted)"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="truncate">
            {roleTitle} at {company}
          </span>
        </Link>

        <div className="mt-6 space-y-6 lg:mt-8 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto lg:pr-1">
          <section>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-(--app-muted)">
              JOB DESCRIPTION
            </p>
            <div className="mt-2 max-h-56 overflow-y-auto rounded-[10px] border border-(--app-line) bg-(--app-surface) px-3 py-2">
              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-(--app-muted)">
                {sidebarJdText}
              </p>
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-(--app-muted)">
              YOUR QUERY
            </p>
            <p className="mt-2 text-sm leading-6 text-(--app-muted)">
              &ldquo;{userQuery}&rdquo;
            </p>
          </section>

          <section>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-(--app-muted)">
              RESUME USED
            </p>
            <div className="mt-2 flex w-full items-center gap-2 rounded-[10px] border border-(--app-line) bg-(--app-surface) px-3 py-1.5 text-sm font-medium text-(--app-text)">
              <FileText className="h-4 w-4 text-(--app-muted)" />
              <span className="min-w-0 flex-1 truncate">
                {displayContextSession?.doc_key ||
                  profile?.primary_resume_key ||
                  "Not available"}
              </span>
            </div>
          </section>

          <section>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-(--app-muted)">
              SESSION HISTORY
            </p>
            <div className="mt-2 space-y-2">
              {sessionHistoryWithActions.length > 0 ? (
                sessionHistoryWithActions.map((historyItem) => {
                  const result = historyItem.agent_result;
                  const actionKey = toActionKeyFromResultType(result.type);
                  const isSelected = selectedSession?.id === historyItem.id;

                  return (
                    <button
                      key={historyItem.id}
                      type="button"
                      onClick={() => {
                        setSelectedHistoryId(historyItem.id);
                        if (actionKey) {
                          setSelectedAction(actionKey);
                        }
                      }}
                      className={`w-full rounded-[10px] border px-3 py-2 text-left transition-colors ${
                        isSelected
                          ? "border-(--app-dark) bg-(--app-dark) text-(--app-bg)"
                          : "border-(--app-line) bg-(--app-surface) text-(--app-text)"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.08em]">
                        {getOutputTitle(result.type)}
                      </p>
                      <p
                        className={`mt-1 text-[11px] ${
                          isSelected
                            ? "text-(--app-surface-soft)"
                            : "text-(--app-muted)"
                        }`}
                      >
                        {formatHistoryTimestamp(
                          getSessionTimestamp(historyItem),
                        )}
                      </p>
                    </button>
                  );
                })
              ) : (
                <p className="rounded-[10px] border border-(--app-line) bg-(--app-surface) px-3 py-2 text-xs text-(--app-muted)">
                  No action history yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </aside>

      <section className="flex-1">
        <header className="flex items-center justify-between border-b border-(--app-line) px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-(--app-line) bg-(--app-surface) px-3 py-1 text-xs font-medium text-(--app-muted)">
              Status: {jobStatusLabel}
            </span>
            <span className="text-xs text-(--app-muted)">
              ID {sessionId ? sessionId.slice(0, 8) : "new"}
            </span>
            {(sessionLoading || historyLoading) && (
              <span className="text-xs text-(--app-muted)">Loading...</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {actionButtons.map((action) => {
              const Icon = action.icon;
              const isActive = selectedAction === action.key;

              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => handleRunAction(action.key)}
                  disabled={isAnalyzing}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    isActive
                      ? "border-(--app-dark) bg-(--app-dark) text-(--app-bg)"
                      : "border-(--app-line) bg-(--app-surface) text-(--app-text)"
                  } disabled:opacity-60`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </header>

        <div className="mx-auto w-full max-w-[760px] px-6 py-7">
          {isAnalyzing ? (
            <article className="rounded-[24px] border border-(--app-line) bg-(--app-surface) p-5">
              <header className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-(--app-dark) text-(--app-bg)">
                    <Zap className="h-4 w-4 animate-pulse" />
                  </span>
                  <div>
                    <h1 className="text-[33px] font-semibold text-(--app-text)">
                      {loadingHeadline}
                    </h1>
                    <p className="text-[11px] font-semibold tracking-[0.1em] text-(--app-muted)">
                      ACTION: {pendingActionLabel.toUpperCase()} | STATUS:{" "}
                      {activeJobStatus.toUpperCase()}
                    </p>
                  </div>
                </div>
              </header>

              <section className="mt-5 rounded-[15px] border border-(--app-line) bg-(--app-surface-soft) p-4 space-y-3">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </section>

              <section className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="rounded-[12px] border border-(--app-line) bg-(--app-surface) p-3 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-7 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <div className="rounded-[12px] border border-(--app-line) bg-(--app-surface) p-3 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </section>

              <section className="mt-6 rounded-[15px] border border-(--app-line) bg-(--app-surface-soft) p-4 space-y-3">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-24 w-full" />
              </section>
            </article>
          ) : (
            <article className="rounded-[24px] border border-(--app-line) bg-(--app-surface) p-5">
              <header className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-(--app-dark) text-(--app-bg)">
                    <Zap className="h-4 w-4" />
                  </span>
                  <div>
                    <h1 className="text-[33px] font-semibold text-(--app-text)">
                      {outputTitle}
                    </h1>
                    <p className="text-[11px] font-semibold tracking-[0.1em] text-(--app-muted)">
                      GENERATED OUTPUT
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-(--app-muted)">
                  <button
                    type="button"
                    className="top-icon-button"
                    onClick={handleCopyOutput}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="top-icon-button"
                    onClick={handleDownloadOutput}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </header>

              {isReviewResult ? (
                <>
                  <section className="mt-5 rounded-[15px] border border-(--app-line) bg-(--app-surface-soft) p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_1.3fr]">
                      <div>
                        <p className="text-[45px] font-semibold text-(--app-text)">
                          Match Score: {matchScore ?? "--"}%
                        </p>
                        <div className="mt-2 inline-flex items-center gap-2 text-xs text-(--app-muted)">
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 font-semibold text-white dark:bg-emerald-500">
                            {decision || "Pending"}
                          </span>
                          Confidence: {confidence || "N/A"}
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-(--app-muted)">
                        {selectedResult?.type === "review"
                          ? selectedResult.role_fit.role_fit_summary
                          : "Run a review action to populate this summary."}
                      </p>
                    </div>
                  </section>

                  <section className="mt-5 grid gap-5 border-b border-(--app-line) pb-5 md:grid-cols-2">
                    <div>
                      <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-(--app-text)">
                        <Info className="h-4 w-4" />
                        What is this job?
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-(--app-muted)">
                        {selectedResult?.type === "review"
                          ? selectedResult.what_is_job ||
                            `This is a ${roleTitle} role for ${company}.`
                          : `This is a ${roleTitle} role for ${company}.`}
                      </p>
                    </div>
                    <div>
                      <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-(--app-text)">
                        <Landmark className="h-4 w-4" />
                        Company Info
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-(--app-muted)">
                        {selectedResult?.type === "review"
                          ? selectedResult.search_company?.summary ||
                            "No company summary available in this result."
                          : "No company summary available in this result."}
                      </p>
                    </div>
                  </section>

                  <section className="mt-5 grid gap-5 border-b border-(--app-line) pb-5 md:grid-cols-2">
                    <div>
                      <h2 className="inline-flex items-center gap-2 text-2xl font-semibold text-(--app-text)">
                        <ListChecks className="h-4 w-4" />
                        Match Breakdown
                      </h2>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {selectedResult?.type === "review" ? (
                          <>
                            <div className="rounded-[12px] border border-(--app-line) bg-(--app-surface) p-3">
                              <p className="text-xs text-(--app-muted)">
                                Required Skills
                              </p>
                              <p className="mt-1 text-[30px] font-semibold text-(--app-text)">
                                {
                                  selectedResult.role_fit.comparison_breakdown
                                    .required_matched
                                }{" "}
                                /{" "}
                                {
                                  selectedResult.role_fit.comparison_breakdown
                                    .required_total
                                }
                              </p>
                            </div>
                            <div className="rounded-[12px] border border-(--app-line) bg-(--app-surface) p-3">
                              <p className="text-xs text-(--app-muted)">
                                Preferred Skills
                              </p>
                              <p className="mt-1 text-[30px] font-semibold text-(--app-text)">
                                {
                                  selectedResult.role_fit.comparison_breakdown
                                    .preferred_matched
                                }{" "}
                                /{" "}
                                {
                                  selectedResult.role_fit.comparison_breakdown
                                    .preferred_total
                                }
                              </p>
                            </div>
                            <div className="rounded-[12px] border border-(--app-line) bg-(--app-surface) p-3">
                              <p className="text-xs text-(--app-muted)">
                                Responsibilities
                              </p>
                              <p className="mt-1 text-[30px] font-semibold text-(--app-text)">
                                {
                                  selectedResult.role_fit.comparison_breakdown
                                    .responsibilities_matched
                                }{" "}
                                /{" "}
                                {
                                  selectedResult.role_fit.comparison_breakdown
                                    .responsibilities_total
                                }
                              </p>
                            </div>
                            <div className="rounded-[12px] border border-(--app-line) bg-(--app-surface) p-3">
                              <p className="text-xs text-(--app-muted)">
                                Soft Skills
                              </p>
                              <p className="mt-1 text-[30px] font-semibold text-(--app-text)">
                                {
                                  selectedResult.role_fit.comparison_breakdown
                                    .soft_skills_matched
                                }{" "}
                                /{" "}
                                {
                                  selectedResult.role_fit.comparison_breakdown
                                    .soft_skills_total
                                }
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="col-span-2 rounded-[12px] border border-(--app-line) bg-(--app-surface) p-3 text-sm text-(--app-muted)">
                            Run a review action to display detailed breakdown.
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="inline-flex items-center gap-2 text-2xl font-semibold text-(--app-text)">
                        <ShieldCheck className="h-4 w-4" />
                        Decision Conditions
                      </h2>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-(--app-muted)">
                        {decisionConditions.length > 0 ? (
                          decisionConditions.map((item) => (
                            <li key={item}>{item}</li>
                          ))
                        ) : (
                          <li>No decision conditions available</li>
                        )}
                      </ul>
                    </div>
                  </section>

                  <section className="mt-5">
                    <h2 className="text-2xl font-semibold text-(--app-text)">
                      Requirements Analysis
                    </h2>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          <Check className="h-4 w-4" />
                          Matched Requirements
                        </p>
                        <div className="mt-2 space-y-2">
                          {matchedRequirements.length > 0 ? (
                            matchedRequirements.map((item) => (
                              <div
                                key={item}
                                className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                              >
                                {item}
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[12px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                              No matched requirements yet.
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="inline-flex items-center gap-1 text-sm font-semibold text-rose-700 dark:text-rose-300">
                          <TriangleAlert className="h-4 w-4" />
                          Missing Skills &amp; Gaps
                        </p>
                        <div className="mt-2 space-y-2">
                          {skillGaps.length > 0 ? (
                            skillGaps.map((item) => (
                              <div
                                key={item}
                                className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200"
                              >
                                {item}
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/35 dark:text-rose-200">
                              No gaps detected yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              ) : null}

              <section className="mt-6 rounded-[15px] border border-(--app-line) bg-(--app-surface-soft) p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-(--app-text)">
                    Generated Output
                  </h3>
                  {editableOutputType ? (
                    <button
                      type="button"
                      onClick={handleSaveEditedOutput}
                      disabled={!canSaveEditedOutput}
                      className="rounded-full bg-(--app-dark) px-4 py-1.5 text-xs font-semibold text-(--app-bg) disabled:opacity-60"
                    >
                      {editChat.isPending ? "Saving..." : "Save Edit"}
                    </button>
                  ) : null}
                </div>

                {editableOutputType ? (
                  <textarea
                    value={editedOutput}
                    onChange={(event) =>
                      setDraftByChatId((previous) => ({
                        ...previous,
                        [activeChatId]: event.target.value,
                      }))
                    }
                    className="h-[220px] w-full resize-none rounded-[12px] border border-(--app-line) bg-(--app-surface) px-3 py-2 text-sm leading-6 text-(--app-text) outline-none"
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-(--app-muted)">
                    {editedOutput}
                  </p>
                )}
              </section>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}
