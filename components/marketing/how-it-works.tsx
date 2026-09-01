"use client";

import { FadeUp, GlassCard, SectionHeading } from "@/components/marketing/ui";

const STEPS = [
  {
    n: "01",
    title: "Select Class & Syllabus",
    body: "Choose the class, subject, syllabus, chapter, or topic.",
  },
  {
    n: "02",
    title: "Generate Questions",
    body: "AI creates questions based on the selected content.",
  },
  {
    n: "03",
    title: "Customize & Review",
    body: "Edit questions, add or remove questions, and configure the exam.",
  },
  {
    n: "04",
    title: "Generate & Publish",
    body: "Automatically create multiple shuffled question papers based on class strength and publish the exam.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-7xl">
        <FadeUp>
          <SectionHeading title="From Syllabus to Exam in 4 Simple Steps" />
        </FadeUp>
        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <FadeUp key={step.n} delay={i * 0.06} className="relative">
              <GlassCard className="h-full">
                <p className="text-xs font-semibold tracking-[0.2em] text-violet-300">STEP {step.n}</p>
                <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
              </GlassCard>
              {i < STEPS.length - 1 ? (
                <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 lg:block">
                  <svg className="h-6 w-8" viewBox="0 0 32 24" fill="none" aria-hidden>
                    <path
                      d="M2 12h22"
                      className="marketing-flow-line"
                      stroke="url(#g)"
                      strokeWidth="1.5"
                    />
                    <path d="M22 6l8 6-8 6" stroke="#8b6cff" strokeWidth="1.5" />
                    <defs>
                      <linearGradient id="g" x1="0" x2="1">
                        <stop stopColor="#4f8cff" />
                        <stop offset="1" stopColor="#8b6cff" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              ) : null}
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
