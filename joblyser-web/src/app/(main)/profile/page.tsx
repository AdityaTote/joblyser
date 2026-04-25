"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  FileText,
  Lock,
  LogOut,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useDocuments, useUploadDocument } from "@/hooks/queries/useDocument";
import {
  useSetPrimaryResume,
  useUpdateProfile,
  useUser,
} from "@/hooks/queries/useUser";
import { useStore } from "@/store/useStore";

type ProfileTab = "general" | "resume" | "security";

const tabLabels: Record<ProfileTab, string> = {
  general: "General",
  resume: "Resume",
  security: "Security",
};

export default function ProfilePage() {
  const router = useRouter();
  const { clearStore } = useStore();
  const { data: user } = useUser();
  const { data: documents = [] } = useDocuments();
  const updateProfile = useUpdateProfile();
  const uploadDocument = useUploadDocument();
  const setPrimaryResume = useSetPrimaryResume();

  const [activeTab, setActiveTab] = useState<ProfileTab>("general");
  const [draft, setDraft] = useState<{
    name?: string;
    email?: string;
    targetTitle?: string;
    bio?: string;
  }>({});
  const [selectedResumeKey, setSelectedResumeKey] = useState<string | null>(
    null,
  );
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(
    null,
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const name = draft.name ?? user?.name ?? "";
  const email = draft.email ?? user?.email ?? "";
  const targetTitle = draft.targetTitle ?? user?.job_title ?? "";
  const bio = draft.bio ?? user?.description ?? user?.bio ?? "";

  const primaryResumeKey = user?.primary_resume_key || user?.resume_key || "";
  const selectedKey = selectedResumeKey || primaryResumeKey;

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : "-";

  const handleSaveProfile = () => {
    if (!user?.profile_id) {
      toast.error("Profile ID not found. Please refresh and try again.");
      return;
    }

    updateProfile.mutate(
      {
        id: user.profile_id,
        data: {
          name,
          job_title: targetTitle,
          description: bio,
        },
      },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadResume = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    uploadDocument.mutate(file, {
      onSuccess: (data) => {
        setSelectedResumeKey(data.key);
        setUploadedResumeName(file.name);
        toast.success("Resume uploaded successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

    event.target.value = "";
  };

  const handleSavePrimaryResume = () => {
    if (!selectedKey) {
      toast.error("Select or upload a resume first");
      return;
    }

    setPrimaryResume.mutate(selectedKey, {
      onSuccess: () => {
        window.localStorage.setItem(
          "joblyser-primary-resume-name",
          selectedKey,
        );
        toast.success("Primary resume updated");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const handleSignOut = () => {
    clearStore();
    router.push("/signin");
  };

  return (
    <main className="min-h-[calc(100vh-2.25rem)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-[1080px]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#7f838e]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[230px_1fr]">
          <aside className="surface-card h-fit self-start rounded-[24px] p-4">
            <div className="relative mx-auto h-20 w-20">
              <div
                aria-hidden
                className="h-20 w-20 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url(https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80)",
                }}
              />
              <button
                type="button"
                className="absolute bottom-0 right-0 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d4d6dd] bg-[#f2f2f4] text-[#646976]"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-2xl font-semibold text-[#1a1c23]">
                {name || "Guest User"}
              </p>
              <p className="text-sm text-[#8a8f9a]">
                {targetTitle || "Add your target role"}
              </p>
            </div>

            <div className="mt-4 space-y-2 border-t border-[#dfe0e5] pt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#8a8f9a]">Member since</span>
                <span className="font-medium text-[#2a2d35]">
                  {memberSince}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8a8f9a]">Plan</span>
                <span className="rounded-full bg-[#12131b] px-2 py-0.5 text-[11px] font-semibold text-white">
                  Premium
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[12px] border border-[#d7d8de] bg-[#f4f4f6] text-sm font-semibold text-[#db3f45]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </aside>

          <section>
            <div className="mb-3 flex items-center justify-end gap-2 text-xl font-semibold">
              <Zap className="h-4 w-4" />
              Joblyser
            </div>

            <div className="mb-4 grid grid-cols-3 border-b border-[#dfe0e5]">
              {(Object.keys(tabLabels) as ProfileTab[]).map((tab) => {
                const isActive = activeTab === tab;
                const Icon =
                  tab === "general" ? User : tab === "resume" ? FileText : Lock;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`inline-flex items-center justify-center gap-2 border border-transparent px-4 py-2.5 text-sm font-semibold ${
                      isActive
                        ? "border-[#d9dae0] bg-[#f1f1f3] text-[#1f2128]"
                        : "text-[#888d98]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tabLabels[tab]}
                  </button>
                );
              })}
            </div>

            {activeTab === "general" && (
              <article className="surface-card rounded-[24px]">
                <div className="p-5">
                  <h1 className="text-3xl font-semibold text-[#191b22]">
                    Personal Information
                  </h1>
                  <p className="mt-1 text-sm text-[#848994]">
                    Update your personal details and professional bio.
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-1.5 block text-xs font-semibold text-[#23252d]"
                      >
                        Full Name
                      </label>
                      <input
                        id="name"
                        value={name}
                        onChange={(event) =>
                          setDraft((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-[12px] border border-[#d7d8dd] bg-[#f5f5f6] px-3 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-xs font-semibold text-[#23252d]"
                      >
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setDraft((previous) => ({
                            ...previous,
                            email: event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-[12px] border border-[#d7d8dd] bg-[#f5f5f6] px-3 text-sm outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="title"
                        className="mb-1.5 block text-xs font-semibold text-[#23252d]"
                      >
                        Target Job Title
                      </label>
                      <input
                        id="title"
                        value={targetTitle}
                        onChange={(event) =>
                          setDraft((previous) => ({
                            ...previous,
                            targetTitle: event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-[12px] border border-[#d7d8dd] bg-[#f5f5f6] px-3 text-sm outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="bio"
                        className="mb-1.5 block text-xs font-semibold text-[#23252d]"
                      >
                        Professional Bio
                      </label>
                      <textarea
                        id="bio"
                        value={bio}
                        onChange={(event) =>
                          setDraft((previous) => ({
                            ...previous,
                            bio: event.target.value,
                          }))
                        }
                        className="h-28 w-full resize-none rounded-[12px] border border-[#d7d8dd] bg-[#f5f5f6] px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <footer className="flex justify-end border-t border-[#dfe0e5] p-4">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={updateProfile.isPending}
                    className="rounded-full bg-[#12131b] px-8 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {updateProfile.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </footer>
              </article>
            )}

            {activeTab === "resume" && (
              <article className="surface-card rounded-[24px]">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-semibold text-[#191b22]">
                        Resume Management
                      </h1>
                      <p className="mt-1 text-sm text-[#848994]">
                        Manage your primary resume used for AI analysis.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUploadClick}
                      disabled={uploadDocument.isPending}
                      className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-[#d7d8dd] bg-[#f2f2f4] px-4 text-sm font-semibold text-[#2a2d35] disabled:opacity-60"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadDocument.isPending ? "Uploading..." : "Upload PDF"}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={handleUploadResume}
                  />

                  <p className="mt-6 text-sm font-semibold text-[#2a2d35]">
                    Uploaded Resumes
                  </p>
                  {uploadedResumeName ? (
                    <p className="mt-1 text-xs text-[#8a8f9a]">
                      Latest upload: {uploadedResumeName}
                    </p>
                  ) : null}

                  <div className="mt-3 space-y-2">
                    {documents.length > 0 ? (
                      documents.map((resume) => {
                        const isPrimary = resume.key === primaryResumeKey;
                        const isSelected = resume.key === selectedKey;

                        return (
                          <div
                            key={resume.id}
                            className={`flex items-center justify-between rounded-[14px] border px-4 py-3 ${
                              isSelected
                                ? "border-[#2d2f37] bg-[#f5f5f6]"
                                : "border-[#d7d8dd] bg-[#f2f2f4]"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedResumeKey(resume.key)}
                              className="flex items-start gap-3 text-left"
                            >
                              <FileText className="mt-0.5 h-5 w-5 text-[#6f7480]" />
                              <div>
                                <p className="text-sm font-semibold text-[#2a2d35]">
                                  {resume.key}
                                </p>
                                <p className="text-xs text-[#8a8f9a]">
                                  Uploaded on{" "}
                                  {new Date(
                                    resume.created_at,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedResumeKey(resume.key)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                isPrimary
                                  ? "bg-[#12131b] text-white"
                                  : "border border-[#d7d8dd] bg-[#f6f6f7] text-[#2a2d35]"
                              }`}
                            >
                              {isPrimary ? "Primary" : "Select"}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="rounded-[12px] border border-[#d7d8dd] bg-[#f2f2f4] px-3 py-4 text-sm text-[#6f7480]">
                        No resumes uploaded yet.
                      </p>
                    )}
                  </div>
                </div>

                <footer className="flex justify-end border-t border-[#dfe0e5] p-4">
                  <button
                    type="button"
                    onClick={handleSavePrimaryResume}
                    disabled={setPrimaryResume.isPending || !selectedKey}
                    className="rounded-full bg-[#12131b] px-8 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {setPrimaryResume.isPending ? "Saving..." : "Save Changes"}
                  </button>
                </footer>
              </article>
            )}

            {activeTab === "security" && (
              <article className="surface-card rounded-[24px]">
                <div className="p-5">
                  <h1 className="text-3xl font-semibold text-[#191b22]">
                    Password &amp; Security
                  </h1>
                  <p className="mt-1 text-sm text-[#848994]">
                    Password update endpoint is not integrated yet in the
                    current API.
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <label
                        htmlFor="currentPassword"
                        className="mb-1.5 block text-xs font-semibold text-[#23252d]"
                      >
                        Current Password
                      </label>
                      <input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(event) =>
                          setCurrentPassword(event.target.value)
                        }
                        className="h-10 w-full rounded-[12px] border border-[#d7d8dd] bg-[#f5f5f6] px-3 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="newPassword"
                        className="mb-1.5 block text-xs font-semibold text-[#23252d]"
                      >
                        New Password
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        className="h-10 w-full rounded-[12px] border border-[#d7d8dd] bg-[#f5f5f6] px-3 text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-1.5 block text-xs font-semibold text-[#23252d]"
                      >
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        className="h-10 w-full rounded-[12px] border border-[#d7d8dd] bg-[#f5f5f6] px-3 text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <footer className="flex justify-start border-t border-[#dfe0e5] p-4">
                  <button
                    type="button"
                    disabled
                    className="rounded-full bg-[#12131b] px-8 py-2.5 text-sm font-semibold text-white opacity-60"
                  >
                    Update Password
                  </button>
                </footer>
              </article>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
