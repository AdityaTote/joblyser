export const ACTION_BADGE_MAP: Record<
  string,
  { bg: string; text: string; border: string; label: string }
> = {
  review: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/20",
    label: "Review",
  },
  cover_letter: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    label: "Cover Letter",
  },
  linkedin_note: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    label: "LinkedIn Note",
  },
  cold_mail: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    label: "Cold Email",
  },
};

export function getBadge(type: string) {
  const style = ACTION_BADGE_MAP[type] || ACTION_BADGE_MAP.review;
  return (
    <span
      className={`${style.bg} ${style.text} ${style.border} border text-xs rounded-full px-2.5 py-0.5 font-medium`}
    >
      {style.label}
    </span>
  );
}
