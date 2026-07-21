import { PlusIcon } from "@/components/dashboard/profile/ProfileIcons";

interface ResumeItem {
  id: string;
  name: string;
  size: string;
  uploaded: string;
  primary: boolean;
}

interface ResumesPanelProps {
  resumes: ResumeItem[];
  currentResumes: ResumeItem[];
  currentPage: number;
  totalPages: number;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
  onPageChange: (page: number) => void;
}

export default function ResumesPanel({
  resumes,
  currentResumes,
  currentPage,
  totalPages,
  onSetPrimary,
  onDelete,
  onPageChange,
}: ResumesPanelProps) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-white text-base font-semibold">Resumes</h2>
        <button className="border border-zinc-700 text-zinc-300 text-sm font-medium rounded-xl px-4 py-1.5 hover:border-amber-400 hover:text-amber-400 transition-all flex items-center gap-1.5">
          <PlusIcon strokeWidth="2.5" />
          Upload Resume
        </button>
      </div>

      {resumes.length === 0 ? (
        <div className="text-zinc-600 text-sm text-center py-8">
          No resumes yet. Upload one to get started.
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {currentResumes.map((resume) => (
            <div
              key={resume.id}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-800 border rounded-xl px-4 py-3 ${
                resume.primary ? "border-amber-400/40" : "border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-4 flex-1 w-full min-w-0">
                <span className="text-xl shrink-0">📄</span>
                <div className="flex flex-col min-w-0 truncate">
                  <span className="text-zinc-300 text-sm font-medium truncate">
                    {resume.name}
                  </span>
                  <span className="text-zinc-500 text-xs mt-0.5 truncate">
                    {resume.size} &middot; Uploaded {resume.uploaded}
                  </span>
                </div>
                {resume.primary && (
                  <span className="shrink-0 bg-amber-400/10 text-amber-400 border border-amber-400/30 text-xs rounded-full px-2.5 py-0.5 font-medium ml-2">
                    Primary
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                {!resume.primary && (
                  <button
                    onClick={() => onSetPrimary(resume.id)}
                    className="text-zinc-400 text-xs hover:text-amber-400 transition-all border border-zinc-700 hover:border-amber-400 rounded-lg px-3 py-1 font-medium"
                  >
                    Set as Primary
                  </button>
                )}
                <button
                  onClick={() => onDelete(resume.id)}
                  className="text-zinc-600 text-xs hover:text-red-400 transition-all border border-zinc-800 hover:border-red-400/50 rounded-lg px-3 py-1 font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-800 pt-4 mt-2">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-zinc-400 text-sm hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => onPageChange(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                      currentPage === i + 1
                        ? "bg-amber-400 text-black"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="text-zinc-400 text-sm hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <label className="border-2 border-dashed border-zinc-800 bg-zinc-900/20 p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-400 hover:bg-amber-400/5 transition-all group block">
        <span className="text-xl mb-1.5 opacity-80 mix-blend-luminosity grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
          📎
        </span>
        <span className="text-zinc-500 text-sm font-medium group-hover:text-zinc-300 transition-colors">
          Drop a new resume here or click to upload
        </span>
        <span className="text-zinc-600 text-xs mt-1 font-mono uppercase tracking-widest">
          PDF or DOCX &middot; Max 5MB
        </span>
        <input type="file" accept=".pdf,.docx" className="hidden" />
      </label>
    </section>
  );
}
