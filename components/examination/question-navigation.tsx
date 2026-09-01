"use client";

import { cn } from "@/lib/utils";

export function QuestionNavigation({
  total,
  index,
  answered,
  onJump,
}: {
  total: number;
  index: number;
  answered: Set<number>;
  onJump: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onJump(i)}
          className={cn(
            "h-10 rounded-lg text-sm",
            i === index && "bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] text-white",
            i !== index && answered.has(i) && "bg-emerald-500/20 text-emerald-300",
            i !== index && !answered.has(i) && "bg-white/8 text-slate-400",
          )}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
