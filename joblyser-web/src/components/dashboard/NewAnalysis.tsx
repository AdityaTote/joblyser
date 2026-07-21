"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, MessageSquare, Mail, FileText } from "lucide-react";
import NewAnalysisHeader from "@/components/dashboard/new/NewAnalysisHeader";
import OutputStep from "@/components/dashboard/new/OutputStep";
import ResumeStep from "@/components/dashboard/new/ResumeStep";
import RoleStep from "@/components/dashboard/new/RoleStep";
import SubmitBar from "@/components/dashboard/new/SubmitBar";
import { useDocuments } from "@/hooks/queries/useDocument";
import { useRunAgent } from "@/hooks/queries/useAgent";
import { useStore } from "@/store/useStore";

const actions = [
  {
    id: "review",
    icon: BarChart2,
    title: "Resume Review",
    desc: "Role fit score, matched skills, missing skills and a full resume summary tailored to this job.",
  },
  {
    id: "linkedin",
    icon: MessageSquare,
    title: "LinkedIn Note",
    desc: "A short personalised connection note to send to the hiring manager or a team member.",
  },
  {
    id: "email",
    icon: Mail,
    title: "Cold Email",
    desc: "A direct outreach email to send before or after applying — confident and concise.",
  },
  {
    id: "cover_letter",
    icon: FileText,
    title: "Cover Letter",
    desc: "A full tailored cover letter ready to attach to your application.",
  },
];

export default function NewAnalysis() {
  const router = useRouter();
  const [jdText, setJdText] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const user = useStore((s) => s.user);
  const { data: documents } = useDocuments();
  const runAgent = useRunAgent();

  // Build primary resume info
  const primaryResume = useMemo(() => {
    const primaryKey = user?.primary_resume_key;
    if (!primaryKey || !documents) return null;

    const doc = documents.find((d) => d.key === primaryKey);
    if (!doc) return null;

    const name = doc.link ? doc.link.split("/").pop() || doc.key : doc.key;
    const date = new Date(doc.updated_at);
    return {
      key: doc.key,
      name,
      updated: `Updated ${date.toLocaleDateString()}`,
    };
  }, [user?.primary_resume_key, documents]);

  // Auto-select primary resume
  useEffect(() => {
    if (primaryResume && !selectedResumeId) {
      setSelectedResumeId(primaryResume.key);
    }
  }, [primaryResume, selectedResumeId]);

  const toggleAction = (id: string) => {
    setSelectedActions((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const isFormValid =
    jdText.trim().length > 0 &&
    selectedResumeId !== null &&
    selectedActions.length > 0;

  const handleSubmit = () => {
    if (!isFormValid) return;

    const primaryAction = selectedActions[0];

    runAgent.mutate(
      {
        action: primaryAction,
        user_query: `Run ${primaryAction}`,
        jd_text: jdText,
        doc_key: selectedResumeId as string,
      },
      {
        onSuccess: (data) => {
          if (data.session_id) {
            setIsRedirecting(true);
            router.push(`/sessions/${data.session_id}?jobId=${data.job_id}`);
          }
        },
      }
    );
  };

  const getButtonText = () => {
    if (selectedActions.length === 0) return "Select at least one action";
    if (selectedActions.length === 1) {
      const action = actions.find((a) => a.id === selectedActions[0]);
      return `Run ${action?.title} →`;
    }
    return `Run ${selectedActions.length} Analyses →`;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 lg:py-24">
      <NewAnalysisHeader
        title="Define the Gap."
        description="Paste the job description and your resume to uncover missing keywords, score your fit, and generate tailored outreach."
      />
      <div className="space-y-0">
        <RoleStep
          jdText={jdText}
          maxLength={8000}
          onChange={(value) => setJdText(value.slice(0, 8000))}
        />
        <ResumeStep
          primaryResume={primaryResume}
          selectedResumeId={selectedResumeId}
          onSelectResume={setSelectedResumeId}
        />
        <OutputStep
          actions={actions}
          selectedActions={selectedActions}
          onToggle={toggleAction}
        />
      </div>
      <SubmitBar
        isFormValid={isFormValid}
        isLoading={runAgent.isPending || isRedirecting}
        buttonText={getButtonText()}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

