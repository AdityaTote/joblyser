import Link from "next/link";

interface AuthHeaderProps {
  label: string;
  title: string;
  brandClassName?: string;
}

export default function AuthHeader({
  label,
  title,
  brandClassName = "mb-8",
}: AuthHeaderProps) {
  return (
    <>
      <Link
        href="/"
        className={`lg:hidden font-heading text-xl font-bold text-amber-400 tracking-tight ${brandClassName}`}
      >
        Joblyser.
      </Link>
      <span className="text-amber-400 text-sm uppercase tracking-widest font-semibold mb-3 block">
        {label}
      </span>
      <h1 className="font-heading text-3xl font-bold text-white mb-8 leading-tight">
        {title}
      </h1>
    </>
  );
}
