"use client";

import { FadeUp, GlassCard, SectionHeading } from "@/components/marketing/ui";

const ROLES = [
  {
    title: "Super Admin",
    preview: "Platform · 42 institutions · 99.9% uptime",
    points: [
      "Manage the entire platform",
      "Manage institutions",
      "Control users and permissions",
      "View overall analytics",
    ],
  },
  {
    title: "Admin",
    preview: "Campus · 24 classes · 6 live exams",
    points: [
      "Manage classes",
      "Manage teachers and students",
      "Conduct exams",
      "Generate question papers",
    ],
  },
  {
    title: "Teacher",
    preview: "Class 12 · Polity · 48 students",
    points: [
      "Generate AI questions",
      "Create and manage exams",
      "Review student performance",
      "Access class analytics",
    ],
  },
  {
    title: "Student",
    preview: "Next exam in 02:14:08 · Paper B",
    points: ["Take mock tests", "View results", "Track performance", "Identify improvement areas"],
  },
];

export function RolesSection() {
  return (
    <section id="solutions" className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-7xl">
        <FadeUp>
          <SectionHeading title="Built for Every Role in Your Institution" />
        </FadeUp>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {ROLES.map((role, i) => (
            <FadeUp key={role.title} delay={i * 0.05}>
              <GlassCard className="group h-full">
                <h3 className="text-xl font-semibold text-white">{role.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  {role.points.map((point) => (
                    <li key={point}>· {point}</li>
                  ))}
                </ul>
                <div className="mt-5 max-h-0 overflow-hidden rounded-xl border border-transparent bg-[#080b1c] px-3 text-xs text-violet-200 opacity-0 transition-all duration-300 group-hover:max-h-16 group-hover:border-white/10 group-hover:py-3 group-hover:opacity-100">
                  Preview · {role.preview}
                </div>
              </GlassCard>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
