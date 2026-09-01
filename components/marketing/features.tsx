"use client";

import {
  BarChart3,
  Files,
  FolderKanban,
  Lock,
  ScanSearch,
  Shield,
  Sparkles,
  Users,
  LineChart,
} from "lucide-react";
import { FadeUp, GlassCard, SectionHeading } from "@/components/marketing/ui";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Question Generation",
    body: "Generate questions from syllabus, topics, images, and documents.",
  },
  {
    icon: FolderKanban,
    title: "Exam Management",
    body: "Create, schedule, manage, and monitor exams.",
  },
  {
    icon: Files,
    title: "Multiple Question Papers",
    body: "Automatically shuffle questions and generate multiple paper versions based on class strength.",
  },
  {
    icon: ScanSearch,
    title: "Automated Evaluation",
    body: "Evaluate objective questions instantly.",
  },
  {
    icon: Users,
    title: "Class Management",
    body: "Manage classes, students, subjects, and teachers.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    body: "Understand student and class performance.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    body: "Dedicated access for Super Admin, Admin, Teachers, and Students.",
  },
  {
    icon: LineChart,
    title: "Reports & Insights",
    body: "Generate downloadable performance reports.",
  },
  {
    icon: Lock,
    title: "Secure & Reliable",
    body: "Secure data management and controlled user access.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-7xl">
        <FadeUp>
          <SectionHeading title="Everything You Need to Manage Smarter Exams" />
        </FadeUp>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((item, i) => (
            <FadeUp key={item.title} delay={i * 0.04}>
              <GlassCard className="h-full">
                <item.icon className="h-5 w-5 text-violet-300" />
                <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </GlassCard>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
