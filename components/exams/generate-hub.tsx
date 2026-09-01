"use client";

import Link from "next/link";
import { BookOpen, FileText, ImageIcon, Library, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";

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
          {METHODS.map((item) => (
            <Link
              key={item.href}
              href={
                item.href === "bank"
                  ? `${basePath}/questions`
                  : `${basePath}/exams/new?classId=${classId}&source=${item.href}`
              }
            >
              <Card className="h-full">
                <item.icon className="h-5 w-5 text-violet-300" />
                <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{item.body}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
