"use client";

import { FadeUp, SectionHeading } from "@/components/marketing/ui";

const NODES = [
  "Syllabus / Topic / Image / Document",
  "AI Content Analysis",
  "Question Generation",
  "Question Review & Customization",
  "Question Shuffle Engine",
  "Multiple Question Paper Generation",
  "Publish Exam",
];

export function WorkflowSection() {
  return (
    <section id="workflow" className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-3xl">
        <FadeUp>
          <SectionHeading eyebrow="Pipeline" title="AI-Powered Exam Creation" />
        </FadeUp>
        <div className="relative mt-12">
          <svg className="absolute left-[18px] top-3 h-[calc(100%-24px)] w-2 overflow-visible" aria-hidden>
            <line
              x1="4"
              y1="0"
              x2="4"
              y2="100%"
              stroke="url(#flow)"
              strokeWidth="2"
              className="marketing-flow-line"
            />
            <defs>
              <linearGradient id="flow" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#4f8cff" />
                <stop offset="1" stopColor="#8b6cff" />
              </linearGradient>
            </defs>
          </svg>
          <ol className="space-y-4">
            {NODES.map((node, i) => (
              <FadeUp key={node} delay={i * 0.05}>
                <li className="flex items-center gap-4">
                  <span className="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-violet-300/40 bg-[#0c1024] text-xs font-semibold text-violet-200 shadow-[0_0_22px_rgba(139,108,255,0.5)]">
                    {i + 1}
                  </span>
                  <div className="marketing-glass flex-1 rounded-2xl px-4 py-3 text-sm text-slate-200">{node}</div>
                </li>
              </FadeUp>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
