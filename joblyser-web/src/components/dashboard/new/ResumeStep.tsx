import { UploadCloud, File, Check, Loader2, RefreshCw } from "lucide-react";
import { useUploadDocument } from "@/hooks/queries/useDocument";

interface PrimaryResume {
  key: string;
  name: string;
  updated: string;
}

interface ResumeStepProps {
  primaryResume: PrimaryResume | null;
  selectedResumeId: string | null;
  onSelectResume: (key: string) => void;
}

export default function ResumeStep({
  primaryResume,
  selectedResumeId,
  onSelectResume,
}: ResumeStepProps) {
  const uploadDoc = useUploadDocument();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    uploadDoc.mutate(file, {
      onSuccess: (data) => {
        onSelectResume(data.key);
      },
    });
  };

  const isSelected = primaryResume && selectedResumeId === primaryResume.key;

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-12 py-12 border-t border-zinc-800">
      <div>
        <h2 className="font-heading text-white text-xl mb-2">
          02. The Candidate
        </h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          {primaryResume
            ? "Your primary resume will be used for analysis. You can also upload a different one."
            : "Upload your resume to get started."}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {/* Primary resume card */}
        {primaryResume && (
          <div
            onClick={() => onSelectResume(primaryResume.key)}
            className={`flex items-center justify-between p-4 cursor-pointer border transition-all ${
              isSelected
                ? "border-amber-400 bg-amber-400/5 ring-1 ring-amber-400/20"
                : "border-zinc-800 bg-zinc-900/20 hover:border-zinc-600 hover:bg-zinc-800/40"
            }`}
          >
            <div className="flex items-center gap-4">
              <File
                className={`w-5 h-5 ${isSelected ? "text-amber-400" : "text-zinc-500"}`}
              />
              <div className="flex flex-col">
                <span
                  className={`text-sm font-medium ${isSelected ? "text-white" : "text-zinc-300"}`}
                >
                  {primaryResume.name}
                </span>
                <span className="text-zinc-500 text-xs mt-0.5">
                  Primary resume • {primaryResume.updated}
                </span>
              </div>
            </div>
            {isSelected ? (
              <Check className="w-5 h-5 text-amber-400" />
            ) : (
              <span className="text-xs text-zinc-600 uppercase tracking-wider">Select</span>
            )}
          </div>
        )}

        {/* Divider when primary resume exists */}
        {primaryResume && (
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-zinc-800" />
            <span className="text-xs text-zinc-600 uppercase tracking-widest">or upload another</span>
            <div className="flex-1 border-t border-zinc-800" />
          </div>
        )}

        {/* Upload area */}
        <label className={`border-2 border-dashed border-zinc-800 bg-zinc-900/20 ${primaryResume ? 'p-8' : 'p-12'} flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${uploadDoc.isPending ? 'opacity-50 pointer-events-none' : 'hover:border-amber-400 hover:bg-amber-400/5'}`}>
          {uploadDoc.isPending ? (
            <Loader2 className="w-8 h-8 text-amber-400 mb-4 animate-spin" />
          ) : uploadDoc.isSuccess ? (
            <Check className="w-8 h-8 text-emerald-400 mb-4" />
          ) : (
            <UploadCloud className={`${primaryResume ? 'w-6 h-6 mb-3' : 'w-8 h-8 mb-4'} text-zinc-600 group-hover:text-amber-400 transition-colors`} />
          )}
          <span className="text-zinc-300 font-medium mb-1 group-hover:text-amber-400 transition-colors">
            {uploadDoc.isPending
              ? 'Uploading...'
              : uploadDoc.isSuccess
                ? 'Uploaded! Resume selected.'
                : primaryResume
                  ? 'Upload a different resume'
                  : 'Drag & drop your resume here'}
          </span>
          {!uploadDoc.isPending && !uploadDoc.isSuccess && (
            <span className="text-zinc-600 text-xs mt-2 font-mono uppercase tracking-widest">
              PDF or DOCX, max 5MB
            </span>
          )}
          {uploadDoc.isSuccess && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                uploadDoc.reset();
              }}
              className="mt-2 text-xs text-zinc-500 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Upload another
            </button>
          )}
          <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileChange} disabled={uploadDoc.isPending} />
          {uploadDoc.isError && (
            <p className="text-red-400 text-sm mt-4">{uploadDoc.error.message}</p>
          )}
        </label>
      </div>
    </div>
  );
}
