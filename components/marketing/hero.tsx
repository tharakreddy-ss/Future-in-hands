"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/marketing/ui";

const TRUST = ["Northridge School", "Apex Coaching", "St. Helena College", "Vista Institute", "Oak & Ivy"];

export function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden px-4 pb-20 pt-10 md:px-6 md:pt-16">
      <div className="marketing-grid pointer-events-none absolute inset-0 opacity-60" />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-24 h-24 w-24 rounded-full bg-violet-500/25 blur-2xl"
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-[18%] top-40 h-16 w-16 rounded-full bg-sky-400/20 blur-xl"
        animate={{ y: [0, 16, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <FadeUp>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-violet-200">
            ✦ AI-Powered Exam Management Platform
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-white md:text-6xl">
            AI-Powered Exams.
            <br />
            <span className="gradient-text">Better Outcomes.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">
            Create question papers in seconds, conduct mock tests, automate evaluation, and get intelligent insights
            to improve learning.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/auth/login"
              className="rounded-xl bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_32px_rgba(139,108,255,0.35)] transition hover:brightness-110"
            >
              Get Started Free
            </Link>
            <Link
              href="/#cta"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-violet-300/50 hover:bg-white/5"
            >
              Request Demo
            </Link>
          </div>
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Trusted by Schools, Colleges & Coaching Institutes
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TRUST.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400"
              >
                {name}
              </span>
            ))}
          </div>
        </FadeUp>
        <FadeUp delay={0.12}>
          <HeroDashboard />
        </FadeUp>
      </div>
    </section>
  );
}

function HeroDashboard() {
  const bars = [42, 58, 64, 51, 78, 70, 86, 74];
  return (
    <div className="relative">
      <motion.div
        aria-hidden
        className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-violet-500/30 blur-3xl"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="absolute -right-4 bottom-8 h-24 w-24 rounded-full bg-sky-400/25 blur-3xl"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <div className="marketing-glass relative rounded-[28px] p-5 shadow-[0_0_80px_rgba(99,102,241,0.18)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-medium text-white">Institution overview</p>
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
            AI live
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Total Classes", "24"],
            ["Total Students", "1,280"],
            ["Active Exams", "6"],
            ["Average Score", "78%"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[11px] text-slate-400">{label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#080b1c]/70 p-4">
          <p className="text-xs text-slate-400">Performance</p>
          <div className="mt-3 flex h-24 items-end gap-2">
            {bars.map((h, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-600 to-violet-400"
                initial={{ height: 8 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.6 }}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-slate-300">Recent exams</p>
          {[
            ["Indian Polity Mock", "Live", "92 started"],
            ["Algebra Midterm", "Scheduled", "45 assigned"],
            ["Organic Chemistry", "Closed", "Avg 71%"],
          ].map(([title, status, meta]) => (
            <div key={title} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/4 px-3 py-2 text-xs">
              <span className="text-slate-200">{title}</span>
              <span className="text-slate-500">
                {status} · {meta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
