"use client";

import { FadeUp, GlassCard, SectionHeading } from "@/components/marketing/ui";

const ROLES = [
  {
    title: "Super Admin",
    points: [
      "Manage the entire platform",
      "Manage institutions",
      "Control users and permissions",
      "View overall analytics",
    ],
  },
  {
    title: "Admin",
    points: [
      "Manage classes",
      "Manage teachers and students",
      "Conduct exams",
      "Generate question papers",
    ],
  },
  {
    title: "Teacher",
    points: [
      "Generate AI questions",
      "Create and manage exams",
      "Review student performance",
      "Access class analytics",
    ],
  },
  {
    title: "Student",
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
              <GlassCard className="h-full">
                <h3 className="text-xl font-semibold text-white">{role.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-400">
                  {role.points.map((point) => (
                    <li key={point}>· {point}</li>
                  ))}
                </ul>
              </GlassCard>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
