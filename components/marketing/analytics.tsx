"use client";

import { FadeUp, GlassCard, SectionHeading } from "@/components/marketing/ui";

const METRICS = [
  ["Total Students", "1,280"],
  ["Average Score", "76%"],
  ["Highest Score", "98%"],
  ["Lowest Score", "41%"],
  ["Exam Completion Rate", "94%"],
];

export function AnalyticsSection() {
  const line = [48, 52, 49, 61, 66, 70, 68, 76, 81, 78];
  const dist = [8, 14, 22, 31, 18, 7];
  const donut = [
    { label: "MCQ", value: 55, color: "#8b6cff" },
    { label: "Short", value: 20, color: "#4f8cff" },
    { label: "Long", value: 15, color: "#67e8f9" },
    { label: "T/F", value: 10, color: "#c4b5fd" },
  ];

  return (
    <section id="analytics" className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-7xl">
        <FadeUp>
          <SectionHeading
            title="Turn Exam Data into Actionable Insights"
            subtitle="Track student performance, identify learning gaps, and make better academic decisions."
          />
        </FadeUp>
        <FadeUp className="mt-12">
          <div className="marketing-glass rounded-[28px] p-5 md:p-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {METRICS.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <GlassCard hover={false} className="lg:col-span-2">
                <p className="text-sm font-medium text-white">Student performance</p>
                <svg viewBox="0 0 400 140" className="mt-4 h-36 w-full" role="img" aria-label="Performance trend">
                  <defs>
                    <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b6cff" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#8b6cff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M0 140 L ${line.map((v, i) => `${(i / (line.length - 1)) * 400} ${140 - v * 1.2}`).join(" L ")} L 400 140 Z`}
                    fill="url(#lineFill)"
                  />
                  <polyline
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="2.5"
                    points={line.map((v, i) => `${(i / (line.length - 1)) * 400},${140 - v * 1.2}`).join(" ")}
                  />
                </svg>
              </GlassCard>
              <GlassCard hover={false}>
                <p className="text-sm font-medium text-white">Question type mix</p>
                <div className="mt-4 flex items-center gap-4">
                  <svg viewBox="0 0 42 42" className="h-24 w-24" aria-hidden>
                    <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="#1e2438" strokeWidth="6" />
                    {(() => {
                      let offset = 0;
                      return donut.map((slice) => {
                        const dash = (slice.value / 100) * 100;
                        const el = (
                          <circle
                            key={slice.label}
                            cx="21"
                            cy="21"
                            r="15.9"
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth="6"
                            strokeDasharray={`${dash} ${100 - dash}`}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 21 21)"
                          />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <ul className="space-y-1 text-xs text-slate-400">
                    {donut.map((d) => (
                      <li key={d.label}>
                        {d.label} · {d.value}%
                      </li>
                    ))}
                  </ul>
                </div>
              </GlassCard>
              <GlassCard hover={false} className="lg:col-span-2">
                <p className="text-sm font-medium text-white">Score distribution</p>
                <div className="mt-4 flex h-28 items-end gap-3">
                  {dist.map((h, i) => (
                    <div key={i} className="flex-1">
                      <div
                        className="rounded-t-lg bg-gradient-to-t from-indigo-700 to-sky-400"
                        style={{ height: `${h * 3}px` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                  <span>0–20</span>
                  <span>80–100</span>
                </div>
              </GlassCard>
              <GlassCard hover={false}>
                <p className="text-sm font-medium text-white">Difficulty analysis</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-400">
                  <li className="flex justify-between"><span>Easy</span><span className="text-emerald-300">32%</span></li>
                  <li className="flex justify-between"><span>Medium</span><span className="text-sky-300">46%</span></li>
                  <li className="flex justify-between"><span>Hard</span><span className="text-violet-300">22%</span></li>
                </ul>
              </GlassCard>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {[
                ["Top Performing Students", "Asha, Rohan, Meera"],
                ["Students Needing Attention", "12 flagged"],
                ["Difficult Topics", "Federalism, Electrolysis"],
                ["Easy Topics", "Photosynthesis intro"],
                ["Class Performance Trends", "+6% vs last exam"],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-medium text-violet-200">{title}</p>
                  <p className="mt-2 text-sm text-slate-300">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
