import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/15",
        className,
      )}
      {...props}
    />
  );
}
