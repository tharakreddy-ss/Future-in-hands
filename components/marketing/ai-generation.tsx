"use client";

import { useState } from "react";
import { BookOpen, FileText, ImageIcon, Sparkles } from "lucide-react";
import { FadeUp, GlassCard, SectionHeading } from "@/components/marketing/ui";
import { cn } from "@/lib/utils";

const SOURCES = [
  {
    icon: BookOpen,
    title: "From Syllabus / Topic",
    body: "Select class, subject, chapter, or enter a custom topic.",
  },
  {
    icon: ImageIcon,
    title: "From Image Upload",
    body: "Upload textbook pages, notes, or handwritten content.",
  },
  {
    icon: FileText,
    title: "From Document",
    body: "Upload PDFs, Word files, or study materials.",
  },
  {
    icon: Sparkles,
    title: "Smart Topic Input",
    body: "Describe any topic and let AI generate relevant questions.",
  },
];

const TYPES = ["MCQ", "Short Answer", "Long Answer", "True / False"];

export function AiGenerationSection() {
  const [types, setTypes] = useState(["MCQ"]);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0);
  const stages = ["Analyzing content", "Drafting items", "Validating stems", "Ready to review"];

  function generate() {
    setRunning(true);
    setStage(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setStage(Math.min(i, stages.length - 1));
      if (i >= stages.length - 1) {
        clearInterval(id);
        setTimeout(() => setRunning(false), 700);
      }
    }, 700);
  }

  return (
    <section id="ai-generation" className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-7xl">
        <FadeUp>
          <SectionHeading
            title="Generate Question Papers in Seconds"
            subtitle="Let AI transform your syllabus, topics, documents, and images into structured exam-ready question papers."
          />
        </FadeUp>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOURCES.map((item, i) => (
            <FadeUp key={item.title} delay={i * 0.05}>
              <GlassCard className="h-full">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-500/15 text-violet-200 shadow-[0_0_24px_rgba(139,108,255,0.25)]">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </GlassCard>
            </FadeUp>
          ))}
        </div>
        <FadeUp className="mt-10" delay={0.1}>
          <div className="marketing-glass grid gap-8 rounded-[28px] p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8">
            <div>
              <p className="text-sm font-medium text-white">Question generation preview</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {["Select Class", "Select Subject", "Select Chapter"].map((label) => (
                  <label key={label} className="text-xs text-slate-400">
                    {label}
                    <select className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-slate-200">
                      <option>{label.replace("Select ", "")} 1</option>
                    </select>
                  </label>
                ))}
                <label className="text-xs text-slate-400">
                  Number of Questions
                  <select className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1020] px-3 py-2 text-sm text-slate-200">
                    <option>20</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                </label>
              </div>
              <p className="mt-4 text-xs text-slate-400">Question types</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TYPES.map((type) => {
                  const on = types.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setTypes((prev) => (on ? prev.filter((t) => t !== type) : [...prev, type]))
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        on ? "border-violet-400/60 bg-violet-500/20 text-white" : "border-white/10 text-slate-400",
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={generate}
                className="mt-6 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,108,255,0.3)]"
              >
                Generate Questions with AI
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#080b1c] p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-violet-300">AI processor</p>
              <ol className="mt-5 space-y-3">
                {stages.map((label, i) => (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        running && i <= stage ? "bg-violet-400 shadow-[0_0_12px_#a78bfa]" : "bg-slate-600",
                      )}
                    />
                    <span className={running && i <= stage ? "text-white" : "text-slate-500"}>{label}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all duration-500"
                  style={{ width: running ? `${((stage + 1) / stages.length) * 100}%` : "8%" }}
                />
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
