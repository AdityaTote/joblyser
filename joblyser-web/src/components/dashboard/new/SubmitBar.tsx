interface SubmitBarProps {
  isFormValid: boolean;
  isLoading: boolean;
  buttonText: string;
  onSubmit: () => void;
}

export default function SubmitBar({
  isFormValid,
  isLoading,
  buttonText,
  onSubmit,
}: SubmitBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-24">
      <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest text-center sm:text-left order-2 sm:order-1">
        Secure processing.
        <br />
        No data retention.
      </p>
      <button
        onClick={onSubmit}
        disabled={!isFormValid || isLoading}
        className={`shrink-0 px-10 py-5 font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center order-1 sm:order-2 ${
          !isFormValid
            ? "bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800"
            : "bg-amber-400 text-[#0a0a0a] hover:bg-amber-300"
        }`}
      >
        {isLoading ? (
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          buttonText
        )}
      </button>
    </div>
  );
}
