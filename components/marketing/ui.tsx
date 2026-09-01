"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 shadow-[0_0_24px_rgba(139,108,255,0.45)]">
        <Sparkles className="h-4 w-4 text-white" aria-hidden />
      </span>
      <span className="text-base font-semibold tracking-tight text-white">MOCKTEST AI</span>
    </span>
  );
}

export function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300/80">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-base leading-relaxed text-slate-400 md:text-lg">{subtitle}</p> : null}
    </div>
  );
}

export function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "marketing-glass rounded-3xl p-6 transition duration-300",
        hover && "hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-[0_0_40px_rgba(124,92,252,0.16)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
