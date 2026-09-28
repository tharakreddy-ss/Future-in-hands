"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/layout/empty-state";
import { cn } from "@/lib/utils";
import {
  FAQ_ITEMS,
  GUIDES,
  QUICK_LINKS,
  TROUBLESHOOTING,
  type HelpCategory,
} from "@/components/help/help-content";

const CATEGORIES: Array<HelpCategory | "All"> = [
  "All",
  "Exams",
  "Results",
  "Classes",
  "Notifications",
  "Profile",
  "Account",
  "Technical Issues",
];

export function StudentHelp({
  institutionName,
  institutionEmail,
  institutionPhone,
}: {
  institutionName: string | null;
  institutionEmail: string | null;
  institutionPhone: string | null;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategory | "All">("All");

  const faqs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (!needle) return true;
      return `${item.question} ${item.answer}`.toLowerCase().includes(needle);
    });
  }, [query, category]);

  const hasInstitutionContact = Boolean(institutionEmail || institutionPhone);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-white">Quick links</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {QUICK_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <Card className="h-full">
                <p className="font-medium text-white">{item.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">FAQ</h2>
        <p className="mt-1 text-sm text-slate-500">Answers match how this student portal works today.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search questions"
            aria-label="Search FAQ"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                category === item
                  ? "bg-violet-500/30 text-white"
                  : "bg-white/8 text-slate-400 hover:text-white",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          {faqs.length === 0 ? (
            <EmptyState title="No matching questions" description="Try another search term or choose All." />
          ) : (
            faqs.map((item) => (
              <Card key={item.id} className="p-0 hover:translate-y-0">
                <details className="group p-5">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium text-white">{item.question}</p>
                      <Badge tone="purple">{item.category}</Badge>
                    </div>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.answer}</p>
                </details>
              </Card>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">How-to guides</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {GUIDES.map((guide) => (
            <Card key={guide.title}>
              <h3 className="font-semibold text-white">{guide.title}</h3>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-400">
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Exam rules (general)</h2>
        <Card className="mt-3 space-y-2 text-sm text-slate-400">
          <p>Exams start only when they are assigned to you and the exam window is live.</p>
          <p>Answers are saved as you select them. You can change a selection until you submit.</p>
          <p>When time is up, the attempt is submitted from saved answers. This page never shows exam questions or correct answers.</p>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Troubleshooting</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {TROUBLESHOOTING.map((item) => (
            <Card key={item.title}>
              <h3 className="font-semibold text-white">{item.title}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
                {item.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Support</h2>
        <Card className="mt-3 space-y-2 text-sm text-slate-400">
          <p>
            This portal does not include a built-in help desk, ticketing system, or support chatbot. For account or
            institution-specific issues, please contact your institution administrator
            {institutionName ? ` at ${institutionName}` : ""}.
          </p>
          {hasInstitutionContact ? (
            <p className="text-slate-300">
              {institutionEmail ? `Email on file: ${institutionEmail}` : null}
              {institutionEmail && institutionPhone ? " · " : null}
              {institutionPhone ? `Phone on file: ${institutionPhone}` : null}
            </p>
          ) : (
            <p>No institution email or phone is stored on your account record.</p>
          )}
        </Card>
      </section>
    </div>
  );
}
