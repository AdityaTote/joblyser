"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Zap, FileText, Mail, Link as LinkIcon, Upload, CheckCircle2,
  AlertCircle, Send, Copy, History, Download, Terminal, Settings2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "@/store/useStore";
import { useSession, useSessionHistory, useRunAgent, useEditChat, useJobStatus } from "@/hooks/queries/useAgent";
import { useUser } from "@/hooks/queries/useUser";
import { useUploadDocument } from "@/hooks/queries/useDocument";
import { AgentResult } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";


export default function SessionView() {
  const router = useRouter();
  const params = useParams();
  const id = params?.sessionId as string;
  const isServerSession = !!id && id !== "new";
  const { user, updateUser } = useStore();
  const [jdText, setJdText] = useState("");
  const [query, setQuery] = useState("");
  const [editableOutput, setEditableOutput] = useState("");
  const [isDirtyEdit, setIsDirtyEdit] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const lastSavedContentRef = React.useRef("");
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(null);
  const [uploadedResumeKey, setUploadedResumeKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resumeMode, setResumeMode] = useState<"profile" | "upload">("profile");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const resumeSectionRef = React.useRef<HTMLDivElement | null>(null);

  const { data: session, isLoading: sessionLoading, refetch: refetchSession } = useSession(id);
  const { data: sessionHistory = [], refetch: refetchSessionHistory } = useSessionHistory(id);
  const { data: profile } = useUser();
  const uploadDocument = useUploadDocument();
  const runAgent = useRunAgent();
  const editChat = useEditChat();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(0);
  const [historyInitialized, setHistoryInitialized] = useState(false);
  const { data: jobStatus } = useJobStatus(currentJobId);
  const normalizedJobStatus = String(jobStatus?.status || "").toLowerCase();


  React.useEffect(() => {
    if (session?.jd_text && !jdText) {
      setJdText(session.jd_text);
    }
  }, [session, jdText]);

  React.useEffect(() => {
    if (normalizedJobStatus === "complete" || normalizedJobStatus === "completed") {
      // Job finished! Refresh session data
      refetchSession();
      refetchSessionHistory();
      // Clear current job ID after a short delay or immediately
      setCurrentJobId(null);
    } else if (normalizedJobStatus === "failed") {
      // Handle failure
      setCurrentJobId(null);
    }
  }, [normalizedJobStatus, refetchSession]);


  const handleAnalyze = async (action: string) => {
    const effectiveDocKey =
      resumeMode === "profile"
        ? profile?.primary_resume_key || profile?.resume_key || user?.resume_key
        : uploadedResumeKey;
    if (!effectiveDocKey) return;
    if (!jdText) return;
    runAgent.mutate(
      {
        action,
        user_query: query,
        jd_text: jdText,
        doc_key: effectiveDocKey,
        session_id: isServerSession ? id : undefined,
      },
      {
        onSuccess: (data) => {
          if (data.job_id) {
            setCurrentJobId(data.job_id);
          }
          if (!isServerSession && data.session_id) {
            router.replace(`/sessions/${data.session_id}`);
          }
        },
      }
    );
  };

  const handleSelectResumeFile = () => {
    fileInputRef.current?.click();
  };

  const handleUploadResume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are supported.");
      return;
    }
    setUploadError(null);
    uploadDocument.mutate(file, {
      onSuccess: (data) => {
        setUploadedResumeName(file.name);
        setUploadedResumeKey(data.key);
        updateUser({ resume_key: data.key });
      },
      onError: (error: unknown) => {
        if (error instanceof Error) {
          setUploadError(error.message);
          return;
        }
        setUploadError("Failed to upload PDF.");
      },
    });
    e.target.value = "";
  };

  const handleScrollToResume = () => {
    resumeSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };


  const getOutputContent = (result?: AgentResult | null) => {
    if (!result) return "No data available.";
    const persistedEditedText = (result as AgentResult & { edited_text?: string }).edited_text;
    if (persistedEditedText && persistedEditedText.trim()) {
      return persistedEditedText;
    }
    switch (result.type) {
      case "review": {
        const companyLines: string[] = [];
        const industry = result.search_company?.industry?.trim();
        const summary = result.search_company?.summary?.trim();
        const products = result.search_company?.products?.filter(Boolean) || [];
        const opportunities = result.search_company?.opportunities?.filter(Boolean) || [];
        const risks = result.search_company?.risks?.filter(Boolean) || [];

        if (industry) companyLines.push(`Industry: ${industry}`);
        if (summary) companyLines.push(`Summary: ${summary}`);
        if (products.length > 0) companyLines.push(`Products: ${products.join(", ")}`);
        if (opportunities.length > 0) companyLines.push(`Opportunities: ${opportunities.join(", ")}`);
        if (risks.length > 0) companyLines.push(`Risks: ${risks.join(", ")}`);

        const companyIntel =
          companyLines.length > 0
            ? `Company Intel\n${companyLines.join("\n")}`
            : "Company Intel\nNo company details returned for this job description.";

        return `${result.role_fit.role_fit_summary || "JD Reviewed Successfully."}\n\n${companyIntel}`;
      }
      case "apply_note": 
        return result.application_note;
      case "cover_letter": 
        const cl = result.cover_letter;
        return cl.edited_text || `${cl.header.date}\nTo: ${cl.header.company_name}\n\n${cl.body.paragraph_1_hook}\n\n${cl.body.paragraph_2_proof}\n\n${cl.body.paragraph_3_company_fit}\n\n${cl.body.paragraph_4_complete_picture}\n\n${cl.body.paragraph_5_cta}\n\n${cl.sign_off.closing},\n${cl.sign_off.candidate_name}`;
      case "linkedin_note": 
        return result.linkedin_note.edited_text || result.linkedin_note.note;
      case "cold_mail": 
        return result.cold_mail.edited_text || `Subject: ${result.cold_mail.subject}\n\n${result.cold_mail.email_body}`;
      default: return "Unknown output type";
    }
  };

  const isAnalyzing =
    runAgent.isPending ||
    (currentJobId !== null &&
      normalizedJobStatus !== "complete" &&
      normalizedJobStatus !== "completed" &&
      normalizedJobStatus !== "failed");
  const effectiveDocKey =
    resumeMode === "profile"
      ? profile?.primary_resume_key || profile?.resume_key || user?.resume_key
      : uploadedResumeKey;
  const canRunAnalysis = !!jdText && !!effectiveDocKey && !isAnalyzing;

  React.useEffect(() => {
    if (sessionHistory.length === 0) return;
    if (!historyInitialized || selectedHistoryIndex >= sessionHistory.length) {
      setSelectedHistoryIndex(sessionHistory.length - 1);
      setHistoryInitialized(true);
    }
  }, [sessionHistory.length, historyInitialized, selectedHistoryIndex]);

  const selectedHistoryItem =
    sessionHistory[selectedHistoryIndex] || sessionHistory[sessionHistory.length - 1] || session;
  const resultObj = selectedHistoryItem?.agent_result;
  const outputContent = getOutputContent(resultObj);
  const isEditableOutputType =
    resultObj?.type === "linkedin_note" ||
    resultObj?.type === "cover_letter" ||
    resultObj?.type === "cold_mail";

  React.useEffect(() => {
    setEditableOutput(outputContent);
    lastSavedContentRef.current = outputContent;
    setIsDirtyEdit(false);
  }, [outputContent]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  React.useEffect(() => {
    if (!isEditableOutputType || !isDirtyEdit) return;
    if (!isServerSession || !selectedHistoryItem?.id) return;
    if (!editableOutput.trim()) return;
    if (editableOutput === lastSavedContentRef.current) return;
    if (editChat.isPending) return;

    const timer = setTimeout(() => {
      editChat.mutate(
        {
          chatId: selectedHistoryItem.id,
          sessionId: id,
          editedText: editableOutput,
        },
        {
          onSuccess: () => {
            lastSavedContentRef.current = editableOutput;
            setIsDirtyEdit(false);
            setSavedAt(new Date().toISOString());
          },
        },
      );
    }, 5000);

    return () => clearTimeout(timer);
  }, [
    editableOutput,
    editChat,
    id,
    isDirtyEdit,
    isEditableOutputType,
    isServerSession,
    selectedHistoryItem?.id,
  ]);

  const renderFormattedOutput = (text: string) => {
    return text
      .split("\n\n")
      .filter(Boolean)
      .map((block, index) => (
        <p key={index} className="whitespace-pre-wrap leading-relaxed mb-4 last:mb-0">
          {block}
        </p>
      ));
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-text3 text-[10px] font-mono uppercase tracking-widest mb-1">
            <History className="w-3 h-3" />
            <span>SESSION_ID: {isServerSession ? id?.substring(0, 8) : "NEW_SESSION"}</span>
          </div>
          <h1 className="text-[24px]">
            Analysis <span className="text-brand">Workbench</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="btn-ghost h-8 px-4 text-[11px]"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            EXPORT
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="btn-ghost h-8 px-4 text-[11px]"
            onClick={handleScrollToResume}
          >
            <Upload className="w-3.5 h-3.5 mr-2" />
            SYNC_RESUME
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
        {/* Input Section */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2 pb-4">
          <Card className="premium-card bg-surface border-border">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-[14px] flex items-center gap-2">
                <div className="w-7 h-7 bg-surface2 border border-border rounded-[4px] flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-brand" />
                </div>
                Job Description
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sessionLoading ? (
                <Skeleton className="w-full min-h-[220px] rounded-[8px]" />
              ) : (
                <Textarea
                  placeholder="Paste the job description here..."
                  className="input-field min-h-[220px] resize-none w-full font-mono text-[12px]"
                  value={jdText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJdText(e.target.value)}
                />
              )}
            </CardContent>
          </Card>

          <Card className="premium-card bg-surface border-border">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-[14px] flex items-center gap-2">
                <div className="w-7 h-7 bg-surface2 border border-border rounded-[4px] flex items-center justify-center">
                  <Terminal className="w-3.5 h-3.5 text-brand" />
                </div>
                Execution Commands
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 grid grid-cols-2 gap-2">
              {[
                {
                  id: "review",
                  label: "JD Review",
                  icon: Zap,
                  cmd: "--analyze",
                },
                {
                  id: "cover_letter",
                  label: "Cover Letter",
                  icon: FileText,
                  cmd: "--gen-cl",
                },
                {
                  id: "cold_mail",
                  label: "Cold Mail",
                  icon: Mail,
                  cmd: "--gen-mail",
                },
                {
                  id: "linkedin_note",
                  label: "LinkedIn Note",
                  icon: LinkIcon,
                  cmd: "--gen-note",
                },
              ].map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="h-14 flex flex-col items-start justify-center px-4 rounded-[4px] border border-border bg-surface2 hover:bg-brand/5 hover:border-brand/30 transition-all group"
                  onClick={() => handleAnalyze(action.id)}
                  disabled={!canRunAnalysis}
                >
                  <div className="flex items-center gap-2 w-full">
                    <action.icon className="w-3.5 h-3.5 text-brand group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-semibold text-text1 group-hover:text-brand">
                      {action.label}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-text3 mt-1">
                    {action.cmd}
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card ref={resumeSectionRef} className="premium-card bg-surface border-border">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-[14px] flex items-center gap-2">
                <div className="w-7 h-7 bg-surface2 border border-border rounded-[4px] flex items-center justify-center">
                  <Upload className="w-3.5 h-3.5 text-brand" />
                </div>
                Resume Sync
              </CardTitle>
              <CardDescription className="text-[12px] text-text3 mt-1">
                Upload your resume PDF here so commands can run against your real profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={resumeMode === "profile" ? "default" : "outline"}
                  className="h-8 text-[11px]"
                  onClick={() => setResumeMode("profile")}
                >
                  Use Profile Resume
                </Button>
                <Button
                  type="button"
                  variant={resumeMode === "upload" ? "default" : "outline"}
                  className="h-8 text-[11px]"
                  onClick={() => setResumeMode("upload")}
                >
                  Upload New Resume
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleUploadResume}
                className="hidden"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] text-text3 font-mono">
                  {effectiveDocKey
                    ? `RESUME_STATUS: CONNECTED${uploadedResumeName ? ` (${uploadedResumeName})` : ""}`
                    : "RESUME_STATUS: NOT_CONNECTED"}
                </div>
                <Button
                  onClick={handleSelectResumeFile}
                  disabled={uploadDocument.isPending || resumeMode !== "upload"}
                  className="btn-primary h-8 px-4 text-[11px]"
                >
                  {uploadDocument.isPending ? "Uploading..." : "Upload PDF"}
                </Button>
              </div>
              {resumeMode === "profile" && !(profile?.primary_resume_key || profile?.resume_key || user?.resume_key) && (
                <p className="text-[11px] text-amber-300">
                  No primary resume found in profile. Add one from{" "}
                  <Link href="/user/profile" className="underline text-brand">
                    Profile Settings
                  </Link>
                  .
                </p>
              )}
              {uploadError && (
                <p className="text-[11px] text-red-400 font-mono">{uploadError}</p>
              )}
            </CardContent>
          </Card>

          {sessionHistory.length > 0 && (
            <Card className="premium-card bg-surface border-border">
              <CardHeader className="p-0 mb-3">
                <CardTitle className="text-[13px] flex items-center gap-2">
                  <History className="w-4 h-4 text-brand" />
                  Previous Runs
                </CardTitle>
                <CardDescription className="text-[11px] text-text3">
                  Open any previous output from this same session.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {sessionHistory.map((item, index) => {
                    const typeLabel = item.agent_result?.type?.toUpperCase?.() || "RUN";
                    const isActive = index === selectedHistoryIndex;
                    const preview = item.jd_text?.slice(0, 42) || "No prompt preview";
                    return (
                      <button
                        key={`${item.id}-${index}`}
                        type="button"
                        onClick={() => setSelectedHistoryIndex(index)}
                        className={[
                          "w-full text-left rounded-[8px] border px-3 py-2 transition-colors",
                          isActive
                            ? "border-brand/40 bg-brand/10"
                            : "border-border bg-surface2/20 hover:bg-surface2/40",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold">{typeLabel} #{index + 1}</span>
                          <span className="text-[10px] text-text3">
                            {new Date(item.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-text3 truncate mt-1">{preview}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Output Section */}
        <div className="lg:col-span-7 flex flex-col overflow-hidden min-h-0">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center bg-surface border border-border rounded-[8px]"
              >
                <div className="relative mb-6">
                  <div className="w-12 h-12 border-2 border-brand/10 border-t-brand rounded-full animate-spin" />
                  <Terminal className="absolute inset-0 m-auto w-4 h-4 text-brand animate-pulse" />
                </div>
                <h3 className="text-[16px] mb-1 font-semibold">
                  {normalizedJobStatus === "pending" || normalizedJobStatus === "queued"
                    ? "Queuing Request..."
                    : "Processing Analysis..."}
                </h3>
                <p className="text-text3 text-center max-w-xs text-[12px] font-mono">
                  [SYSTEM] Status: {jobStatus?.status?.toUpperCase() || "INITIALIZING"}...
                </p>
              </motion.div>
            ) : resultObj ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <Tabs defaultValue="content" className="flex-1 flex flex-col min-h-0">
                  <div className="nav-pill-container mb-4">
                    <TabsList className="bg-transparent p-0 gap-1">
                      <TabsTrigger
                        value="content"
                        className="nav-pill-item data-[state=active]:active"
                      >
                        OUTPUT_CONTENT
                      </TabsTrigger>
                      <TabsTrigger
                        value="analysis"
                        className="nav-pill-item data-[state=active]:active"
                      >
                        SYSTEM_INSIGHTS
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="content"
                    className="flex-1 overflow-hidden mt-0"
                  >
                    <Card className="h-full border border-border bg-surface rounded-[8px] flex flex-col overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 border-b border-border bg-surface2/50">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-surface border border-border rounded-[4px] flex items-center justify-center">
                            <Terminal className="w-4 h-4 text-brand" />
                          </div>
                          <CardTitle className="text-[13px] font-semibold uppercase tracking-wider">
                            {resultObj?.type || "Output"}
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          {isEditableOutputType && (
                            <>
                              {editChat.isPending ? (
                                <span className="text-[10px] text-amber-300 font-mono mr-1">Auto-saving...</span>
                              ) : savedAt && !isDirtyEdit ? (
                                <span className="text-[10px] text-green-400 font-mono mr-1">
                                  Saved {new Date(savedAt).toLocaleTimeString()}
                                </span>
                              ) : isDirtyEdit ? (
                                <span className="text-[10px] text-text3 font-mono mr-1">Autosave in 5s...</span>
                              ) : null}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-[10px] px-2"
                                disabled
                              >
                                Auto Save
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-text3 hover:text-brand"
                            onClick={() => copyToClipboard(isEditableOutputType ? editableOutput : outputContent)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-y-auto p-4 bg-surface">
                        {isEditableOutputType ? (
                          <Textarea
                            value={editableOutput}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              setEditableOutput(e.target.value);
                              setIsDirtyEdit(true);
                            }}
                            className="input-field min-h-[420px] h-full resize-none w-full font-mono text-[12px]"
                          />
                        ) : (
                          <div className="ai-content-preview border-none bg-transparent p-0">
                            {renderFormattedOutput(outputContent)}
                          </div>
                        )}
                      </CardContent>
                      <div className="p-3 border-t border-border bg-surface2/30">
                        <div className="relative">
                          <Textarea
                            placeholder="Refine output (e.g. '--make-it-shorter')..."
                            className="input-field pr-12 min-h-[50px] max-h-[100px] w-full font-mono text-[12px]"
                            value={query}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                // handleRefine();
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            className="absolute right-2 bottom-2 btn-primary h-7 w-7"
                            disabled={!query || isAnalyzing}
                            // onClick={handleRefine}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>

                  <TabsContent
                    value="analysis"
                    className="flex-1 mt-0 min-h-0"
                  >
                    <div className="h-full overflow-y-auto pr-2 space-y-4">
                      {resultObj?.type === "review" ? (
                        <>
                          <Card className="premium-card bg-surface border-border p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-[14px] font-semibold">
                                  MATCH_SCORE
                                </h3>
                                <p className="text-[11px] text-text3 font-mono">
                                  PROFILE_ALIGNMENT_INDEX
                                </p>
                              </div>
                              <div className="score-display">
                                {resultObj.role_fit.match_score}%
                              </div>
                            </div>
                            <div className="progress-track">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${resultObj.role_fit.match_score}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="progress-fill"
                              />
                            </div>
                          </Card>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <Card className="premium-card bg-surface border-border p-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-green mb-3">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                STRENGTHS ({resultObj.role_fit.comparison_breakdown.required_matched}/{resultObj.role_fit.comparison_breakdown.required_total})
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {resultObj.role_fit.matched_requirements.map(
                                  (req: { requirement: string }, i: number) => (
                                    <Badge
                                      key={i}
                                      className="badge-green text-[9px]"
                                    >
                                      {req.requirement}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </Card>

                            <Card className="premium-card bg-surface border-border p-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-amber mb-3">
                                <AlertCircle className="w-3.5 h-3.5" />
                                GAPS ({resultObj.role_fit.comparison_breakdown.critical_gaps_count} critical)
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {resultObj.role_fit.unmatched_requirements.map(
                                  (req: { requirement: string }, i: number) => (
                                    <Badge
                                      key={i}
                                      className="badge-amber text-[9px]"
                                    >
                                      {req.requirement}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </Card>
                          </div>
                          
                          <Card className="premium-card bg-surface border-border p-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-brand mb-3">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Company Intel: {resultObj.search_company.industry || "Unknown"}
                            </h4>
                            <div className="space-y-3 text-[12px] text-text2">
                              {resultObj.search_company.summary && (
                                <p className="leading-relaxed">{resultObj.search_company.summary}</p>
                              )}
                              {resultObj.search_company.culture && (
                                <div>
                                  <p className="text-[11px] font-semibold text-text1 mb-1">Culture</p>
                                  <p className="leading-relaxed">{resultObj.search_company.culture}</p>
                                </div>
                              )}
                              {resultObj.search_company.products?.length ? (
                                <div>
                                  <p className="text-[11px] font-semibold text-text1 mb-1">Products</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {resultObj.search_company.products.map((item: string, i: number) => (
                                      <Badge key={i} className="badge-blue text-[9px]">
                                        {item}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              {resultObj.search_company.opportunities?.length ? (
                                <div>
                                  <p className="text-[11px] font-semibold text-text1 mb-1">Opportunities</p>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {resultObj.search_company.opportunities.map((item: string, i: number) => (
                                      <li key={i}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                              {resultObj.search_company.references?.length ? (
                                <div>
                                  <p className="text-[11px] font-semibold text-text1 mb-1">References</p>
                                  <div className="space-y-1">
                                    {resultObj.search_company.references.map((ref: string, i: number) => (
                                      <a
                                        key={i}
                                        href={ref}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block underline text-brand break-all"
                                      >
                                        {ref}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </Card>
                        </>
                      ) : (
                      <Card className="premium-card bg-surface border-border p-4">
                        <div className="flex items-center gap-3 text-text3 text-[12px]">
                          <Settings2 className="w-4 h-4" />
                          <span>No structural analysis available for this payload type.</span>
                        </div>
                      </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-surface2/30 rounded-[8px] border border-dashed border-border p-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 grid-bg opacity-[0.03] pointer-events-none" />
                <div className="w-12 h-12 bg-surface border border-border rounded-[4px] flex items-center justify-center mb-4 relative z-10">
                  <Terminal className="w-6 h-6 text-text3" />
                </div>
                <h3 className="text-[18px] mb-1 font-semibold relative z-10">
                  Ready for Analysis
                </h3>
                <p className="text-text3 max-w-sm leading-relaxed text-[12px] font-mono relative z-10">
                  [SYSTEM] Waiting for input...
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 relative z-10">
                  <Badge className="badge-blue text-[9px]">--analyze</Badge>
                  <Badge className="badge-blue text-[9px]">--gen-cl</Badge>
                  <Badge className="badge-blue text-[9px]">--gen-mail</Badge>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
