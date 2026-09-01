import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] text-white shadow-[0_0_24px_rgba(124,58,237,0.28)] hover:brightness-110",
        variant === "secondary" &&
          "border border-white/10 bg-white/5 text-slate-100 hover:border-violet-400/40 hover:bg-white/10",
        variant === "outline" && "border border-white/15 bg-transparent text-slate-100 hover:border-violet-400/50",
        variant === "ghost" && "text-slate-300 hover:bg-white/8 hover:text-white",
        variant === "danger" && "bg-[#EF4444] text-white hover:bg-red-500",
        className,
      )}
      {...props}
    />
  );
}
