import { Check } from "lucide-react";

const features = [
  "Role Fit Score",
  "Matched Skills",
  "Missing Skills",
  "Cover Letter",
  "Cold Email",
  "LinkedIn Note",
];

export default function Features() {
  return (
    <section
      id="features"
      className="px-6 py-24 lg:py-32 border-t border-zinc-900 bg-[#0c0c0c]"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div>
          <h2 className="font-heading text-5xl lg:text-7xl font-bold text-white leading-tight">
            One analysis.
            <br />
            Six tools.
          </h2>
        </div>

        <div className="flex flex-col gap-6 border-l border-zinc-800 pl-8 lg:pl-12 py-4">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/10">
                <Check className="w-4 h-4 text-amber-400" strokeWidth={3} />
              </div>
              <span className="text-xl lg:text-2xl font-medium text-zinc-200 tracking-tight">
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
