interface NewAnalysisHeaderProps {
  title: string;
  description: string;
}

export default function NewAnalysisHeader({
  title,
  description,
}: NewAnalysisHeaderProps) {
  return (
    <header className="mb-20">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-amber-400 w-12" />
        <span className="text-amber-400 text-sm font-mono uppercase tracking-widest">
          New Session
        </span>
      </div>
      <h1 className="font-heading text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
        {title}
      </h1>
      <p className="text-lg text-zinc-500 max-w-xl leading-relaxed">
        {description}
      </p>
    </header>
  );
}
