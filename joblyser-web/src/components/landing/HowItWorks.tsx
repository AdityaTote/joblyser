export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="px-6 py-24 lg:py-32 border-t border-zinc-900"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-16 lg:gap-8 items-start">
        <div className="lg:col-span-5 flex flex-col gap-16">
          <div className="mb-4">
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              How it works
            </h2>
            <p className="text-zinc-500 text-lg">
              Three steps to your tailored application package.
            </p>
          </div>

          <div className="relative border-l border-zinc-800 ml-4 pl-8 flex flex-col gap-12">
            <div className="relative">
              <span className="absolute -left-[54px] top-0 text-amber-400 font-heading text-2xl font-bold bg-[#0a0a0a] py-1">
                01
              </span>
              <h3 className="text-xl font-medium text-white mb-2">
                Paste the Job Description
              </h3>
              <p className="text-zinc-400">
                Drop in the URL or paste the raw text of the role you want.
              </p>
            </div>
            <div className="relative">
              <span className="absolute -left-[56px] top-0 text-amber-400 font-heading text-2xl font-bold bg-[#0a0a0a] py-1">
                02
              </span>
              <h3 className="text-xl font-medium text-white mb-2">
                Upload Your Resume
              </h3>
              <p className="text-zinc-400">
                Provide your current PDF resume so the AI can map your existing
                experience.
              </p>
            </div>
            <div className="relative">
              <span className="absolute -left-[56px] top-0 text-amber-400 font-heading text-2xl font-bold bg-[#0a0a0a] py-1">
                03
              </span>
              <h3 className="text-xl font-medium text-white mb-2">
                Get Your Action Plan
              </h3>
              <p className="text-zinc-400">
                Instantly view your skill gaps and generate missing assets like
                cover letters.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7 lg:mt-24">
          <div className="bg-[#111] border border-zinc-800 rounded-lg p-8 md:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400 opacity-50" />
            <div className="font-mono text-xs text-zinc-600 mb-8 flex justify-between">
              <span>COVER_LETTER_PREVIEW.TXT</span>
              <span>GEN_ID: 80492</span>
            </div>
            <div className="font-serif text-sm md:text-base text-zinc-300 leading-relaxed space-y-6">
              <p>Dear Hiring Manager,</p>
              <p>
                When I saw the Senior Frontend Engineer opening at Acme Corp, I
                knew I had to apply. With over five years of experience building
                scalable applications using React and TypeScript, my background
                strongly aligns with your need for a developer who can bridge
                the gap between design and engineering.
              </p>
              <p>
                In my recent role at TechNova, I spearheaded the migration of a
                legacy monolithic dashboard into a modular React architecture,
                reducing load times by 40%. While my AWS and Docker usage has
                been supplementary rather than primary, my deep...
              </p>
              <div className="w-full h-24 bg-gradient-to-b from-transparent to-[#111] absolute bottom-0 left-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
