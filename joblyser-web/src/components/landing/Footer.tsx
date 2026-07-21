import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full px-6 py-10 border-t border-zinc-900 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="font-heading text-xl font-bold text-white tracking-tight">
          Joblyser.
        </div>
        <div className="flex gap-6 text-sm text-zinc-500">
          <Link href="#" className="hover:text-amber-400 transition-colors">
            Privacy
          </Link>
          <Link href="#" className="hover:text-amber-400 transition-colors">
            Terms
          </Link>
          <Link href="#" className="hover:text-amber-400 transition-colors">
            Twitter
          </Link>
        </div>
        <div className="text-sm text-zinc-600 font-mono">
          &copy; {new Date().getFullYear()} Built for job seekers.
        </div>
      </div>
    </footer>
  );
}
