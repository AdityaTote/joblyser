"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Briefcase,
  Upload,
  Save,
  Trash2,
  Shield,
  Terminal,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useUser, useUpdateProfile, useSetPrimaryResume } from "@/hooks/queries/useUser";
import { useDocuments, useUploadDocument } from "@/hooks/queries/useDocument";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { data: user, isLoading } = useUser();
  const updateProfile = useUpdateProfile();
  const setPrimaryResume = useSetPrimaryResume();
  const uploadDocument = useUploadDocument();
  const { data: documents = [], isLoading: docsLoading, refetch: refetchDocuments } = useDocuments();
  
  const [draft, setDraft] = useState<{
    name?: string;
    jobTitle?: string;
    bio?: string;
  }>({});
  const [uploadedResumeKey, setUploadedResumeKey] = useState<string | null>(null);
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedResumeKey, setSelectedResumeKey] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const name = draft.name ?? user?.name ?? "";
  const jobTitle = draft.jobTitle ?? user?.job_title ?? "";
  const bio = draft.bio ?? user?.description ?? user?.bio ?? "";

  const handleSave = () => {
    if (user?.profile_id) {
      updateProfile.mutate({
        id: user.profile_id,
        data: { name, job_title: jobTitle, description: bio },
      });
    }
  };

  const handleUploadClick = () => {
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
        setUploadedResumeKey(data.key);
        setSelectedResumeKey(data.key);
        setUploadedResumeName(file.name);
        void refetchDocuments();
      },
      onError: (err: unknown) => {
        if (err instanceof Error) {
          setUploadError(err.message);
          return;
        }
        setUploadError("Failed to upload resume.");
      },
    });
    e.target.value = "";
  };

  const handleMakePrimary = (key?: string) => {
    const keyToUse = key || selectedResumeKey || uploadedResumeKey || user?.resume_key;
    if (!keyToUse) return;
    setPrimaryResume.mutate(keyToUse, {
      onSuccess: () => {
        void refetchDocuments();
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header>
        <div className="badge-blue mb-3">
          <Shield className="w-3 h-3" />
          <span>Account Settings</span>
        </div>
        <h1>
          Your <span className="text-brand">Profile</span>
        </h1>
        <p className="text-text2 mt-2">
          Manage your professional identity and resume data.
        </p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <Card className="premium-card bg-surface border-border">
            <CardHeader className="p-0 mb-8 pb-6 border-b border-border">
              <CardTitle className="text-[18px]">
                Personal Information
              </CardTitle>
              <CardDescription className="text-[13px] text-text3">
                This data powers the AI tailoring for your applications.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 space-y-8">
              {isLoading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="flex items-center gap-6">
                    <Skeleton className="w-20 h-20 rounded-[12px]" />
                    <div className="space-y-2">
                       <Skeleton className="h-4 w-[150px]" />
                       <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-11 w-full" />
                  </div>
                  <Skeleton className="h-[120px] w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-20 h-20 border border-border rounded-[12px] bg-surface2">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-brand/10 text-brand text-2xl font-medium">
                      {name.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 rounded-[6px] w-7 h-7 border border-border bg-surface shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-[16px] font-medium">
                    {name || "Your Name"}
                  </h3>
                  <p className="text-[13px] text-text3">
                    {jobTitle || "Your Professional Title"}
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[11px] text-brand mt-1 uppercase tracking-widest font-medium"
                  >
                    Change profile picture
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-text3 uppercase tracking-widest">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text3" />
                    <Input
                      className="input-field pl-10 w-full h-11"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDraft((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-text3 uppercase tracking-widest">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text3" />
                    <Input
                      className="input-field pl-10 w-full h-11"
                      placeholder="e.g. Senior Product Designer"
                      value={jobTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDraft((prev) => ({ ...prev, jobTitle: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-medium text-text3 uppercase tracking-widest">
                  Professional Summary
                </label>
                <Textarea
                  className="input-field min-h-[120px] resize-none w-full"
                  placeholder="Briefly describe your professional background and key achievements..."
                  value={bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDraft((prev) => ({ ...prev, bio: e.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSave}
                  className="btn-primary h-11 px-8 gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Profile
                </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Resume Management */}
          <Card className="premium-card bg-surface border-border">
            <CardHeader className="p-0 mb-8 pb-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[18px]">Resume Content</CardTitle>
                  <CardDescription className="text-[13px] text-text3">
                    The core data for all AI analyses.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="btn-ghost h-9 px-4"
                  onClick={handleUploadClick}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleUploadResume}
                className="hidden"
              />
              {isLoading ? (
                <Skeleton className="h-[120px] w-full rounded-[8px]" />
              ) : (
                <div className="flex items-center justify-between rounded-[8px] border border-border bg-surface2/40 p-4">
                  <div className="text-[12px] text-text2">
                    Primary Resume Key:{" "}
                    <span className="font-mono text-brand">
                      {user?.primary_resume_key || user?.resume_key || "Not set"}
                    </span>
                    {uploadedResumeName ? (
                      <span className="ml-2 text-text3">Uploaded: {uploadedResumeName}</span>
                    ) : null}
                  </div>
                  <Badge className="badge-blue">
                    <Terminal className="w-3 h-3 mr-1" />
                    AI Ready
                  </Badge>
                </div>
              )}
              <div className="flex flex-col md:flex-row justify-between items-center bg-surface2/50 p-4 rounded-[12px] border border-border gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface border border-border rounded-[6px] flex items-center justify-center">
                    <Terminal className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-[12px] text-text2 leading-relaxed max-w-md">
                    <span className="font-medium text-brand">Pro Tip:</span>{" "}
                    Including specific metrics and outcomes (e.g., &quot;Increased
                    revenue by 20%&quot;) helps the AI generate much stronger assets.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUploadClick}
                    disabled={uploadDocument.isPending}
                    variant="outline"
                    className="btn-ghost h-9 px-4 whitespace-nowrap"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadDocument.isPending ? "Uploading..." : "Upload PDF"}
                  </Button>
                  <Button
                    onClick={() => handleMakePrimary()}
                    disabled={setPrimaryResume.isPending || (!selectedResumeKey && !uploadedResumeKey && !user?.resume_key)}
                    className="btn-primary h-9 px-6 whitespace-nowrap"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {setPrimaryResume.isPending ? "Saving..." : "Make Primary"}
                  </Button>
                </div>
              </div>
              <div className="rounded-[12px] border border-border bg-surface2/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[13px] font-medium">Resume Manager</h4>
                  <span className="text-[11px] text-text3">{documents.length} uploaded</span>
                </div>
                {docsLoading ? (
                  <Skeleton className="h-[80px] w-full rounded-[8px]" />
                ) : documents.length === 0 ? (
                  <p className="text-[12px] text-text3">
                    No uploaded resumes yet. Upload a PDF to manage it here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => {
                      const isPrimary = (user?.primary_resume_key || user?.resume_key) === doc.key;
                      const isSelected = selectedResumeKey === doc.key;
                      return (
                        <div
                          key={doc.id}
                          className={cn(
                            "flex items-center justify-between rounded-[8px] border p-3",
                            isSelected ? "border-brand/40 bg-brand/5" : "border-border bg-surface",
                          )}
                        >
                          <button
                            type="button"
                            className="flex items-center gap-2 text-left flex-1 min-w-0"
                            onClick={() => setSelectedResumeKey(doc.key)}
                          >
                            <FileText className="w-4 h-4 text-brand shrink-0" />
                            <span className="text-[12px] font-mono truncate">{doc.key}</span>
                          </button>
                          <div className="flex items-center gap-2 ml-3">
                            {isPrimary && <Badge className="badge-green">Primary</Badge>}
                            <Button
                              size="sm"
                              variant={isPrimary ? "outline" : "default"}
                              className="h-7 px-3 text-[11px]"
                              disabled={setPrimaryResume.isPending || isPrimary}
                              onClick={() => handleMakePrimary(doc.key)}
                            >
                              {isPrimary ? "Primary" : "Make Primary"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {uploadError && <p className="text-[12px] text-red-400">{uploadError}</p>}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-8">
          <Card className="premium-card bg-surface2/30 border-dashed">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-[16px]">Profile Strength</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6">
              <div className="flex items-center justify-between text-[13px] mb-2">
                <span className="text-text2">Completeness</span>
                <span className="font-mono text-brand font-bold">85%</span>
              </div>
              <div className="progress-track h-2">
                <div className="progress-fill" style={{ width: "85%" }} />
              </div>
              <ul className="space-y-3">
                {[
                  { label: "Basic Info", done: true },
                  { label: "Professional Bio", done: true },
                  { label: "Resume Content", done: true },
                  { label: "Profile Picture", done: false },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[13px]">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border",
                        item.done
                          ? "bg-green/10 text-green border-green/20"
                          : "bg-surface2 text-text3 border-border",
                      )}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <span className={item.done ? "text-text1" : "text-text3"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="premium-card bg-red/5 border-red/20">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-[16px] text-red">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <p className="text-[12px] text-text2 leading-relaxed">
                Deleting your account will permanently remove all your sessions,
                resumes, and generated assets. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                className="w-full h-10 rounded-[8px] gap-2 bg-red hover:bg-red/90 text-white border-none"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
