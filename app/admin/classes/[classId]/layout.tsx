import { requireSession } from "@/lib/auth";
import { requireClassAccess } from "@/lib/resource-access";
import Link from "next/link";
import { classService } from "@/services/class.service";
import { notFound } from "next/navigation";

const tabs = [
  "overview",
  "students",
  "syllabus",
  "questions",
  "tests",
  "performance",
  "settings",
] as const;

const labels: Record<(typeof tabs)[number], string> = {
  overview: "Overview",
  students: "Students",
  syllabus: "Syllabus",
  questions: "Question Bank",
  tests: "Exams",
  performance: "Performance",
  settings: "Settings",
};

export default async function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  await requireClassAccess(await requireSession(["INSTITUTION_ADMIN", "TEACHER"]), classId);
  const cls = await classService.get(classId);
  if (!cls) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-violet-300">{cls.subject}</p>
          <h1 className="text-2xl font-semibold text-white">{cls.name}</h1>
        </div>
        <Link
          href={`/admin/exams/new?classId=${classId}&source=syllabus`}
          className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)]"
        >
          Generate Test
        </Link>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/admin/classes/${classId}/${tab}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 hover:border-violet-400/40 hover:text-white"
          >
            {labels[tab]}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
