"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  BriefcaseBusiness,
  FileText,
  FolderSearch,
  LogOut,
  Mail,
  MessageSquare,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Send,
  Settings,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import { useRunAgent, useSessions } from "@/hooks/queries/useAgent";
import { useUploadDocument } from "@/hooks/queries/useDocument";
import { useUser } from "@/hooks/queries/useUser";
import { useStore } from "@/store/useStore";

const quickOutputOptions = [
  { key: "review", label: "Review", icon: Zap },
  { key: "cover_letter", label: "Cover Letter", icon: FileText },
  { key: "cold_mail", label: "Cold Mail", icon: Mail },
  { key: "linkedin_note", label: "LinkedIn Connection", icon: Network },
] as const;

type OutputKey = (typeof quickOutputOptions)[number]["key"];
type ResumeSource = "primary" | "upload";

const PRIMARY_RESUME_STORAGE_KEY = "joblyser-primary-resume-name";
const DEFAULT_PRIMARY_RESUME_NAME = "Software_Engineer_Resume_2024.pdf";

const subscribeToPrimaryResume = (callback: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = () => callback();
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener("storage", listener);
  };
};

const getPrimaryResumeSnapshot = () => {
  if (typeof window === "undefined") {
    return DEFAULT_PRIMARY_RESUME_NAME;
  }

  return (
    window.localStorage.getItem(PRIMARY_RESUME_STORAGE_KEY) ??
    DEFAULT_PRIMARY_RESUME_NAME
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, clearStore } = useStore();
  const { data: profile } = useUser();
  const { data: sessions = [] } = useSessions();
  const runAgent = useRunAgent();
  const uploadDocument = useUploadDocument();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<OutputKey>("review");
  const [resumeSource, setResumeSource] = useState<ResumeSource>("primary");
  const [searchTerm, setSearchTerm] = useState("");
  const primaryResumeName = useSyncExternalStore(
    subscribeToPrimaryResume,
    getPrimaryResumeSnapshot,
    () => DEFAULT_PRIMARY_RESUME_NAME,
  );
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const accountMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [uploadedResumeFileName, setUploadedResumeFileName] = useState("");
  const [uploadedResumeKey, setUploadedResumeKey] = useState<string | null>(
    null,
  );
  const [jobDescription, setJobDescription] = useState("");

  const primaryResumeKey =
    profile?.primary_resume_key ||
    profile?.resume_key ||
    user?.primary_resume_key ||
    user?.resume_key ||
    "";

  const effectiveDocKey =
    resumeSource === "primary" ? primaryResumeKey : uploadedResumeKey || "";

  const filteredSessions = sessions.filter((session) =>
    session.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const accountName = profile?.name || user?.name || "Guest User";
  const accountEmail = profile?.email || user?.email || "No email";

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const targetNode = event.target as Node | null;

      if (!targetNode) {
        return;
      }

      if (accountMenuRef.current?.contains(targetNode)) {
        return;
      }

      if (accountMenuTriggerRef.current?.contains(targetNode)) {
        return;
      }

      setIsAccountMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isAccountMenuOpen]);

  const handleGoToProfile = () => {
    setIsAccountMenuOpen(false);
    router.push("/profile");
  };

  const handleSignOut = () => {
    setIsAccountMenuOpen(false);
    clearStore();
    router.push("/signin");
  };

  const handleUploadResume = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    uploadDocument.mutate(file, {
      onSuccess: (data) => {
        setUploadedResumeFileName(file.name);
        setUploadedResumeKey(data.key);
        toast.success("Resume uploaded successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

    event.target.value = "";
  };

  const handleAnalyze = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!jobDescription.trim()) {
      return;
    }

    if (!effectiveDocKey) {
      toast.error("Upload or select a resume before running analysis");
      return;
    }

    runAgent.mutate(
      {
        action: selectedOutput,
        user_query: `Generate a ${selectedOutput.replace("_", " ")} for this job`,
        jd_text: jobDescription.trim(),
        doc_key: effectiveDocKey,
      },
      {
        onSuccess: (data) => {
          const params = new URLSearchParams({
            format: selectedOutput,
            resumeSource,
            resumeName:
              resumeSource === "primary"
                ? primaryResumeKey || primaryResumeName
                : uploadedResumeFileName,
          });

          if (data.job_id) {
            params.set("jobId", data.job_id);
          }

          router.push(`/session/${data.session_id}?${params.toString()}`);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  return (
    <main className="flex min-h-screen bg-app text-app">
      <aside
        className={`relative flex flex-col border-r border-[var(--app-line)] bg-[var(--app-surface-soft)] transition-[width] duration-200 ${
          isSidebarOpen ? "w-[280px]" : "w-[74px]"
        }`}
      >
        <div
          className={`flex items-center gap-2 px-3 pb-4 pt-4 ${
            isSidebarOpen ? "justify-between" : "justify-center"
          }`}
        >
          {isSidebarOpen ? (
            <div className="inline-flex min-w-0 items-center gap-2 font-semibold leading-none">
              <Zap className="h-5 w-5 shrink-0 text-[var(--app-text)]" />
              <span className="truncate text-[36px]">Joblyser</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setIsSidebarOpen((previous) => !previous)}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--app-muted)] hover:bg-[var(--app-surface)]"
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </button>
        </div>

        {isSidebarOpen ? (
          <>
            <div className="flex items-center gap-2 px-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--app-muted)]" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-9 w-full rounded-[13px] border border-[var(--app-line)] bg-[var(--app-surface)] pl-9 pr-3 text-sm outline-none placeholder:text-[var(--app-muted)]"
                />
              </div>
              <button
                type="button"
                onClick={() => router.push("/session/new")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-muted)] shadow-[0_2px_4px_rgb(15_23_42/12%)]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex-1 px-3">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/session/${session.id}`}
                    className="flex items-start gap-2 rounded-[10px] px-3 py-2 text-sm font-medium text-[var(--app-text)] hover:bg-[var(--app-surface)]"
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 text-[var(--app-muted)]" />
                    <span className="truncate">
                      Session {session.id.slice(0, 8)}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-[var(--app-muted)]">
                  No sessions found.
                </p>
              )}
            </div>

            <button
              type="button"
              ref={accountMenuTriggerRef}
              onClick={() => setIsAccountMenuOpen((previous) => !previous)}
              className="mt-auto flex w-full items-center justify-between border-t border-[var(--app-line)] px-4 py-4 text-left"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="h-8 w-8 shrink-0 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url(https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80)",
                  }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold leading-4 text-[var(--app-text)]">
                    {accountName}
                  </span>
                  <span className="block truncate pt-1 text-xs text-[var(--app-muted)]">
                    {accountEmail}
                  </span>
                </span>
              </span>

              <LogOut className="h-4 w-4 shrink-0 text-[var(--app-muted)]" />
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col justify-between">
            <div className="flex flex-col items-center gap-4 px-2 pt-4">
              <button
                type="button"
                onClick={() => router.push("/session/new")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--app-line)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-sm"
                aria-label="Add new session"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/session/new")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--app-muted)] hover:bg-[var(--app-surface)]"
                aria-label="Session history"
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </div>

            <div className="border-t border-[var(--app-line)] px-2 py-3">
              <button
                type="button"
                ref={accountMenuTriggerRef}
                onClick={() => setIsAccountMenuOpen((previous) => !previous)}
                className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-full"
                aria-label={`${accountName} profile`}
              >
                <span
                  aria-hidden
                  className="h-8 w-8 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url(https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80)",
                  }}
                />
              </button>
            </div>
          </div>
        )}

        {isAccountMenuOpen ? (
          <div
            ref={accountMenuRef}
            className={`absolute z-20 w-[224px] rounded-[18px] border border-[var(--app-line)] bg-[var(--app-surface)] p-4 shadow-[0_8px_24px_rgb(15_23_42/14%)] ${
              isSidebarOpen ? "bottom-[74px] left-2" : "bottom-2 left-[62px]"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
              My Account
            </p>

            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={handleGoToProfile}
                className="inline-flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-sm text-[var(--app-text)] hover:bg-[var(--app-surface-soft)]"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-sm text-[var(--app-text)] hover:bg-[var(--app-surface-soft)]"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>

            <div className="my-2 h-px bg-[var(--app-line)]" />

            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-sm text-[#ef4444] hover:bg-[var(--app-surface-soft)]"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : null}
      </aside>

      <section className="relative flex-1">
        <div className="flex items-center justify-end px-6 py-4">
          <ThemeToggle />
        </div>

        <div className="mx-auto w-full max-w-[760px] px-6 pt-10 text-center">
          <h1 className="text-[55px] font-semibold tracking-[-0.02em] text-[var(--app-text)]">
            What are we applying for today?
          </h1>
          <p className="mt-2 text-base text-[var(--app-muted)] sm:text-lg">
            Paste a job description and I&apos;ll help you craft the perfect
            application.
          </p>

          <form onSubmit={handleAnalyze} className="mt-8">
            <div className="overflow-hidden rounded-3xl border border-[var(--app-line)] bg-[var(--app-surface)] shadow-[0_4px_14px_rgb(17_18_22/5%)]">
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Paste the Job Description here..."
                className="h-[175px] w-full resize-none border-0 bg-transparent px-4 py-4 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
                required
              />

              <div className="space-y-3 px-4 pb-4 text-left">
                <p className="text-xs font-semibold tracking-wide text-[var(--app-muted)]">
                  Resume Source
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setResumeSource("primary")}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                      resumeSource === "primary"
                        ? "border-[var(--app-text)] bg-[var(--app-text)] text-[var(--app-bg)]"
                        : "border-[var(--app-line)] bg-[var(--app-surface-soft)] text-[var(--app-text)]"
                    }`}
                  >
                    <BriefcaseBusiness className="h-3.5 w-3.5" />
                    Use Primary Resume
                  </button>

                  <button
                    type="button"
                    onClick={() => setResumeSource("upload")}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                      resumeSource === "upload"
                        ? "border-[var(--app-text)] bg-[var(--app-text)] text-[var(--app-bg)]"
                        : "border-[var(--app-line)] bg-[var(--app-surface-soft)] text-[var(--app-text)]"
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload New Resume
                  </button>
                </div>

                {resumeSource === "primary" ? (
                  <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-3 py-1.5 text-xs text-[var(--app-text)]">
                    <FolderSearch className="h-3.5 w-3.5 text-[var(--app-muted)]" />
                    {primaryResumeKey || primaryResumeName}
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--app-line)] bg-[var(--app-surface-soft)] px-3 py-1.5 text-xs font-medium text-[var(--app-text)]">
                    <Upload className="h-3.5 w-3.5 text-[var(--app-muted)]" />
                    {uploadedResumeFileName ||
                      "Select Resume File (.pdf, .docx)"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleUploadResume}
                    />
                  </label>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[var(--app-line)] px-4 py-3">
                <p className="text-xs text-[var(--app-muted)]">
                  {resumeSource === "primary"
                    ? primaryResumeKey
                      ? "Using primary resume from your profile"
                      : "No primary resume found. Upload a resume or set one in Profile."
                    : uploadDocument.isPending
                      ? "Uploading resume..."
                      : uploadedResumeFileName
                        ? "New resume ready"
                        : "Upload a resume to continue"}
                </p>

                <button
                  type="submit"
                  disabled={
                    !jobDescription.trim() ||
                    !effectiveDocKey ||
                    runAgent.isPending ||
                    uploadDocument.isPending
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--app-text)] px-5 py-2.5 text-sm font-semibold text-[var(--app-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runAgent.isPending ? "Analyzing..." : "Analyze & Review"}
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>

          {runAgent.error ? (
            <p className="mt-3 rounded-xl border border-[#f3c2c6] bg-[#fdf1f2] px-4 py-2 text-left text-sm text-[#be2f37]">
              {runAgent.error.message}
            </p>
          ) : null}

          <div className="mt-8 text-center">
            <p className="text-xs font-semibold tracking-wide text-[var(--app-muted)]">
              Output Action (Select one)
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {quickOutputOptions.map((option) => {
                const Icon = option.icon;
                const isActive = selectedOutput === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedOutput(option.key)}
                    className={`inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-xs font-medium ${
                      isActive
                        ? "border-[var(--app-text)] bg-[var(--app-text)] text-[var(--app-bg)]"
                        : "border-[var(--app-line)] bg-[var(--app-surface-soft)] text-[var(--app-muted)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-xs text-[var(--app-muted)]">
              Selected action:{" "}
              {
                quickOutputOptions.find((item) => item.key === selectedOutput)
                  ?.label
              }
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
