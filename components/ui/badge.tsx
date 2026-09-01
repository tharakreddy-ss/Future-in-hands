import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Badge({
  className,
  tone = "slate",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "slate" | "teal" | "amber" | "red" | "green" | "purple" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "slate" && "bg-white/8 text-slate-300",
        tone === "teal" && "bg-cyan-400/10 text-cyan-300",
        tone === "purple" && "bg-violet-500/15 text-violet-200",
        tone === "amber" && "bg-amber-500/15 text-amber-300",
        tone === "red" && "bg-red-500/15 text-red-300",
        tone === "green" && "bg-emerald-500/15 text-emerald-300",
        className,
      )}
      {...props}
    />
  );
}
