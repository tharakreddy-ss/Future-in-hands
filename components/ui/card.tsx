import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#11182A] p-5 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.7)] transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/25 hover:shadow-[0_0_36px_rgba(124,58,237,0.12)]",
        className,
      )}
      {...props}
    />
  );
}
