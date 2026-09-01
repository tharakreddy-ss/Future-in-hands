"use client";

import { FadeUp, GlassCard, SectionHeading } from "@/components/marketing/ui";

const ITEMS = [
  {
    name: "Priya Nair",
    role: "Mathematics Teacher",
    institution: "Northridge School",
    quote: "I can turn a chapter into a balanced paper before the period ends. The shuffle engine is the real time-saver.",
  },
  {
    name: "Dr. Arun Menon",
    role: "School Principal",
    institution: "St. Helena College",
    quote: "Live monitoring and role-based access finally made exam day feel controlled instead of chaotic.",
  },
  {
    name: "Sana Qureshi",
    role: "Academic Coordinator",
    institution: "Apex Coaching",
    quote: "Image-to-questions from our notes is astonishing. Analytics showed us exactly where batches were slipping.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-7xl">
        <FadeUp>
          <SectionHeading title="Loved by Educators & Students" />
        </FadeUp>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {ITEMS.map((item, i) => (
            <FadeUp key={item.name} delay={i * 0.06}>
              <GlassCard className="h-full">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-sm font-semibold">
                    {item.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.role} · {item.institution}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-amber-300" aria-label="5 star rating">
                  ★★★★★
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.quote}</p>
              </GlassCard>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
