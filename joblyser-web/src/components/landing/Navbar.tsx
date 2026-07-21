import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="font-heading text-2xl font-bold text-amber-400 tracking-tight"
        >
          Joblyser.
        </Link>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-white transition-colors"
            >
              How it works
            </Link>
          </nav>
          <Link
            href="/new"
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-[#0a0a0a] font-semibold text-sm rounded-md transition-colors"
          >
            Try Free
          </Link>
        </div>
      </div>
    </header>
  );
}
