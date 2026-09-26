"use client";

import { motion, useReducedMotion } from "framer-motion";
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
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -48px 0px" }}
      transition={{
        duration: reduceMotion ? 0.01 : 0.78,
        delay: reduceMotion ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
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
