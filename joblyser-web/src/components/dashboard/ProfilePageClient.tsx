"use client";

import { useState, useEffect } from "react";
import PersonalInfoPanel from "@/components/dashboard/profile/PersonalInfoPanel";
import ProfileTabs from "@/components/dashboard/profile/ProfileTabs";
import ResumesPanel from "@/components/dashboard/profile/ResumesPanel";
import SecurityPanel from "@/components/dashboard/profile/SecurityPanel";
import { useUser, useUpdateProfile, useSetPrimaryResume } from "@/hooks/queries/useUser";
import { useDocuments, useDeleteDocument } from "@/hooks/queries/useDocument";

const ITEMS_PER_PAGE = 3;

export default function ProfilePageClient() {
  const [activeTab, setActiveTab] = useState<
    "personal" | "resumes" | "security"
  >("personal");
  
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: documents, isLoading: isDocsLoading } = useDocuments();
  const updateProfile = useUpdateProfile();
  const setPrimaryResume = useSetPrimaryResume();
  const deleteDocument = useDeleteDocument();

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    role: "",
    bio: "",
    email: "",
  });
  const [tempProfile, setTempProfile] = useState(profileForm);

  useEffect(() => {
    if (user) {
      const data = {
        name: user.name || "",
        role: user.job_title || "",
        bio: user.bio || "",
        email: user.email || "",
      };
      setProfileForm(data);
      setTempProfile(data);
    }
  }, [user]);

  const [currentPage, setCurrentPage] = useState(1);

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const initials =
    (profileForm.name || "U")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const handleProfileSave = () => {
    if (!user) return;
    updateProfile.mutate(
      {
        id: user.id,
        data: {
          name: tempProfile.name,
          job_title: tempProfile.role,
          bio: tempProfile.bio,
        },
      },
      {
        onSuccess: () => {
          setProfileForm(tempProfile);
          setIsEditing(false);
        },
      }
    );
  };

  const handleProfileCancel = () => {
    setTempProfile(profileForm);
    setIsEditing(false);
  };

  const handleSetPrimaryResume = (id: string) => {
    setPrimaryResume.mutate(id);
  };

  const handleDeleteResume = (id: string) => {
    deleteDocument.mutate(id, {
      onSuccess: () => {
        // Adjust page if necessary
        const nextTotal = Math.max(1, Math.ceil(((documents?.length || 1) - 1) / ITEMS_PER_PAGE));
        setCurrentPage((page) => Math.min(page, nextTotal));
      }
    });
  };

  const mappedResumes = (documents || []).map((doc) => {
    const isPrimary = user?.primary_resume_key === doc.key;
    const date = new Date(doc.updated_at);
    return {
      id: doc.id,
      key: doc.key,
      name: doc.link ? doc.link.split("/").pop() || doc.key : doc.key,
      size: "Unknown", // Assuming size isn't available
      uploaded: date.toLocaleDateString(),
      primary: isPrimary,
    };
  });

  const totalPages = Math.max(1, Math.ceil(mappedResumes.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const currentResumes = mappedResumes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const strength = (() => {
    const pwd = passwordForm.newPass;
    let score = 0;
    if (pwd.length > 0) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+/.test(pwd)) score += 1;

    if (score === 0)
      return { width: "w-0", color: "bg-transparent", label: "" };
    if (score === 1)
      return { width: "w-1/4", color: "bg-red-500", label: "Weak" };
    if (score === 2)
      return { width: "w-2/4", color: "bg-amber-400", label: "Fair" };
    return { width: "w-full", color: "bg-emerald-400", label: "Strong" };
  })();

  const passwordsMatch =
    passwordForm.newPass.length > 0 &&
    passwordForm.newPass === passwordForm.confirm;
  const isPasswordFormValid =
    passwordForm.current.length > 0 &&
    passwordForm.newPass.length >= 8 &&
    passwordsMatch;

  const handlePasswordSubmit = () => {
    if (!isPasswordFormValid) return;
    // We don't have an endpoint for updating password yet, simulating
    setPasswordSuccess(true);
    setPasswordForm({ current: "", newPass: "", confirm: "" });
    setTimeout(() => setPasswordSuccess(false), 2000);
  };

  if (isUserLoading || isDocsLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-white mb-1">
          Profile
        </h1>
        <p className="text-zinc-500 text-sm">
          Manage your account, resumes and security settings.
        </p>
      </header>

      <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "personal" && (
        <PersonalInfoPanel
          isEditing={isEditing}
          initials={initials}
          profileForm={profileForm}
          tempProfile={tempProfile}
          onEdit={() => setIsEditing(true)}
          onCancel={handleProfileCancel}
          onSave={handleProfileSave}
          onChangeTemp={setTempProfile}
        />
      )}

      {activeTab === "resumes" && (
        <ResumesPanel
          resumes={mappedResumes as any}
          currentResumes={currentResumes as any}
          currentPage={safePage}
          totalPages={totalPages}
          onSetPrimary={(id) => {
            const doc = mappedResumes.find(r => r.id === id);
            if (doc) handleSetPrimaryResume(doc.key);
          }}
          onDelete={handleDeleteResume}
          onPageChange={setCurrentPage}
        />
      )}

      {activeTab === "security" && (
        <SecurityPanel
          passwordForm={passwordForm}
          showPassword={showPassword}
          strength={strength}
          passwordsMatch={passwordsMatch}
          isPasswordFormValid={isPasswordFormValid}
          passwordSuccess={passwordSuccess}
          onToggleShow={(field) =>
            setShowPassword({ ...showPassword, [field]: !showPassword[field] })
          }
          onChangePasswordForm={setPasswordForm}
          onSubmit={handlePasswordSubmit}
        />
      )}
    </div>
  );
}
