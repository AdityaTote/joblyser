interface AuthDividerProps {
  text: string;
}

export default function AuthDivider({ text }: AuthDividerProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="h-px bg-zinc-800 flex-1"></div>
      <span className="text-zinc-600 text-sm">{text}</span>
      <div className="h-px bg-zinc-800 flex-1"></div>
    </div>
  );
}
