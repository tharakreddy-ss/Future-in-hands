"use client";

import Link from "next/link";
import { BookOpen, FileText, ImageIcon, Library, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";
import { PremiumBeam } from "@/components/effects/library-effects";

const METHODS = [
  { href: "syllabus", title: "Generate From Class Syllabus", body: "Select class, subject, chapter, and difficulty.", icon: BookOpen },
  { href: "topic", title: "Generate From Topic", body: "Describe a custom topic for AI to cover.", icon: Sparkles },
  { href: "image", title: "Generate From Image", body: "Upload textbook pages or handwritten notes.", icon: ImageIcon },
  { href: "document", title: "Generate From Document", body: "Upload PDF or study material.", icon: FileText },
  { href: "bank", title: "Select From Question Bank", body: "Reuse validated questions already in your bank.", icon: Library },
];

export function GenerateHub({
  classes,
  basePath,
}: {
  classes: Array<{ id: string; name: string }>;
  basePath: string;
}) {
  const classId = classes[0]?.id;
  return (
    <div>
      <PageHeader
        eyebrow="Core workflow"
        title="Generate Test"
        subtitle="Choose how AI should build the next question paper. Papers are shuffled later by class strength."
      />
      {!classId ? (
        <p className="mt-8 text-sm text-slate-400">Create a class first.</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {METHODS.map((item, index) => (
            <Link
              key={item.href}
              href={
                item.href === "bank"
                  ? `${basePath}/questions`
                  : `${basePath}/exams/new?classId=${classId}&source=${item.href}`
              }
            >
              <PremiumBeam active={index < 2} variant={index === 0 ? "ice" : index === 1 ? "ocean" : "colorful"}>
                <Card className="h-full transition duration-300 hover:-translate-y-1 hover:bg-white/[0.07]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl border border-violet-300/15 bg-violet-500/10 text-violet-200 shadow-[0_0_26px_rgba(124,58,237,0.16)]">
                      <item.icon className="h-5 w-5" />
                    </span>
                    {index < 2 ? <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-100">AI flow</span> : null}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.body}</p>
                </Card>
              </PremiumBeam>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
