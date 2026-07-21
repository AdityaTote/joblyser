import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-24 lg:pt-36 lg:pb-32 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        <div className="max-w-xl">
          <span className="block text-amber-400 uppercase tracking-[0.2em] text-xs font-bold mb-6">
            Resume Intelligence
          </span>
          <h1 className="font-heading text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-8">
            Your Resume.
            <br />
            The Job.
            <br />
            The Gap.
            <br />
            <span className="text-zinc-600">Closed in Seconds.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-10 text-zinc-400">
            Joblyser analyzes your existing resume against any job description.
            It identifies exact missing keywords, scores your fit, and generates
            custom cover letters.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/new"
              className="w-full sm:w-auto px-8 py-4 bg-amber-400 hover:bg-amber-500 text-[#0a0a0a] font-bold text-base rounded-md transition-colors text-center"
            >
              Analyze Now &rarr;
            </Link>
            <Link
              href="#sample"
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-zinc-800 hover:border-zinc-600 text-white font-medium text-base rounded-md transition-all text-center"
            >
              See a Sample Report
            </Link>
          </div>
        </div>

        <div className="relative w-full max-w-lg mx-auto lg:ml-auto">
          <div className="absolute -inset-1 bg-amber-400/20 blur-2xl rounded-[2rem] opacity-50" />

          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col gap-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <span className="text-sm font-medium text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Analysis Complete
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                ID: 80492-X
              </span>
            </div>

            <div>
              <div className="text-sm font-medium text-zinc-500 mb-2 uppercase tracking-wide">
                Role Fit
              </div>
              <div className="font-heading text-6xl font-bold text-amber-400">
                87%
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wide">
                Matched Skills
              </div>
              <div className="flex flex-wrap gap-2">
                {["React", "TypeScript", "REST APIs", "Agile"].map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-emerald-950/50 border border-emerald-900 text-emerald-400 rounded-full text-xs font-mono"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wide">
                Missing Skills (Gap)
              </div>
              <div className="flex flex-wrap gap-2">
                {["Docker", "AWS", "CI/CD"].map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-red-950/50 border border-red-900 text-red-400 rounded-full text-xs font-mono"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
