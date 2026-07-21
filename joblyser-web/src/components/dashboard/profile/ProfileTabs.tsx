type ProfileTab = "personal" | "resumes" | "security";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onChange: (tab: ProfileTab) => void;
}

export default function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return (
    <div className="flex items-center gap-6 border-b border-zinc-800">
      {[
        { id: "personal", label: "Personal Info" },
        { id: "resumes", label: "Resumes" },
        { id: "security", label: "Security" },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id as ProfileTab)}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === tab.id
              ? "border-amber-400 text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
