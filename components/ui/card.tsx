import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[1.25rem] border border-white/[0.09] bg-[linear-gradient(145deg,rgba(24,33,57,0.96),rgba(13,19,37,0.96))] p-5 shadow-[0_22px_60px_-38px_rgba(0,0,0,0.95)] transition duration-300 before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:opacity-60 hover:-translate-y-0.5 hover:border-violet-400/35 hover:shadow-[0_20px_54px_-30px_rgba(99,72,255,0.34)]",
        className,
      )}
      {...props}
    />
  );
}
