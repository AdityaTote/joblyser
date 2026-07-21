import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface ActionItem {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface OutputStepProps {
  actions: ActionItem[];
  selectedActions: string[];
  onToggle: (id: string) => void;
}

export default function OutputStep({
  actions,
  selectedActions,
  onToggle,
}: OutputStepProps) {
  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-12 py-12 border-t border-zinc-800 border-b border-zinc-800 mb-16">
      <div>
        <h2 className="font-heading text-white text-xl mb-2">03. The Output</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Select one or more tools. You can always run the others later from the
          session dashboard.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isSelected = selectedActions.includes(action.id);

          return (
            <div
              key={action.id}
              onClick={() => onToggle(action.id)}
              className={`relative p-5 cursor-pointer border transition-all flex flex-col ${
                isSelected
                  ? "border-amber-400 bg-amber-400/5 ring-1 ring-amber-400/20"
                  : "border-zinc-800 bg-zinc-900/20 hover:border-zinc-600 hover:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <Icon
                  strokeWidth={1.5}
                  className={`w-6 h-6 ${isSelected ? "text-amber-400" : "text-zinc-500"}`}
                />
                <div
                  className={`w-5 h-5 flex items-center justify-center transition-colors ${
                    isSelected ? "bg-amber-400" : "border border-zinc-700"
                  }`}
                >
                  {isSelected && (
                    <Check
                      className="w-3.5 h-3.5 text-[#0a0a0a]"
                      strokeWidth={3}
                    />
                  )}
                </div>
              </div>
              <h3
                className={`text-sm font-semibold mb-1.5 ${isSelected ? "text-white" : "text-zinc-300"}`}
              >
                {action.title}
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed">
                {action.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
