"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/marketing/ui";

export function FinalCtaSection() {
  return (
    <section id="cta" className="px-4 pb-24 md:px-6">
      <FadeUp>
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-r from-[#1b1464] via-[#2a176b] to-[#0b1f4a] px-6 py-12 md:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,108,255,0.35),transparent_40%)]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                The Future of Exam Management Starts Here
              </h2>
              <p className="mt-4 max-w-xl text-slate-300">
                Create smarter exams, save valuable time, and help every student learn better with AI-powered
                assessments.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth/login"
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-950 transition hover:bg-violet-100"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/pricing"
                  className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Request a Demo
                </Link>
              </div>
            </div>
            <CtaArt />
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

function CtaArt() {
  return (
    <div className="relative mx-auto h-56 w-full max-w-sm">
      <motion.div
        className="absolute left-10 top-6 h-28 w-28 rounded-full border border-violet-300/30 bg-violet-500/20 blur-[1px]"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <svg viewBox="0 0 280 200" className="relative h-full w-full" aria-hidden>
        <circle cx="140" cy="88" r="34" fill="none" stroke="#a78bfa" strokeWidth="2" />
        <circle cx="140" cy="88" r="8" fill="#c4b5fd" />
        <line x1="140" y1="122" x2="140" y2="150" stroke="#67e8f9" strokeWidth="1.5" />
        <rect x="92" y="148" width="36" height="28" rx="4" fill="#1e1b4b" stroke="#818cf8" />
        <rect x="152" y="142" width="44" height="36" rx="4" fill="#0f172a" stroke="#38bdf8" />
        <path d="M214 48 l8 16 h-16 z" fill="#38bdf8" opacity="0.8" />
        <circle cx="48" cy="60" r="4" fill="#818cf8" />
        <circle cx="232" cy="110" r="3" fill="#67e8f9" />
        <line x1="52" y1="64" x2="110" y2="80" stroke="#6366f1" strokeOpacity="0.6" />
        <line x1="228" y1="108" x2="174" y2="90" stroke="#22d3ee" strokeOpacity="0.5" />
      </svg>
    </div>
  );
}
