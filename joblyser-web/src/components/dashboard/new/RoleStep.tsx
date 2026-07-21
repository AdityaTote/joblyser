interface RoleStepProps {
  jdText: string;
  maxLength: number;
  onChange: (value: string) => void;
}

export default function RoleStep({
  jdText,
  maxLength,
  onChange,
}: RoleStepProps) {
  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-12 py-12 border-t border-zinc-800">
      <div>
        <h2 className="font-heading text-white text-xl mb-2">01. The Role</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Paste the complete job description. Include responsibilities,
          requirements, and nice-to-haves.
        </p>
      </div>
      <div className="relative">
        <textarea
          value={jdText}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. We are looking for a Senior Frontend Engineer who has deep experience with React, TypeScript..."
          className="w-full min-h-[280px] bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 text-white rounded-none p-6 resize-y transition-all placeholder-zinc-700 font-sans leading-relaxed text-base focus:outline-none"
        />
        <div className="absolute bottom-4 right-6 text-xs text-zinc-600 font-mono bg-[#0a0a0a]/80 px-2 py-1 backdrop-blur-sm">
          {jdText.length} / {maxLength}
        </div>
      </div>
    </div>
  );
}
