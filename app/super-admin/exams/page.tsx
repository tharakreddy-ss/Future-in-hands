import { requireSession } from "@/lib/auth";
import { examService } from "@/services/exam.service";
import { examWindow } from "@/lib/exam-window";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/layout/empty-state";
import Link from "next/link";

export default async function SuperAdminExamsPage() {
  await requireSession(["SUPER_ADMIN"]);
  const exams = await examService.list(null);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Platform exams</h1>
      <p className="mt-1 text-slate-500">Monitor scheduled and live exams across institutions.</p>
      <div className="mt-6 space-y-3">
        {exams.length === 0 ? (
          <EmptyState title="No exams yet" description="Institution admins will appear here once they schedule tests." />
        ) : (
          exams.map((exam) => (
            <Card key={exam.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{exam.title}</p>
                <p className="text-sm text-slate-500">
                  {exam.institution.name} · {exam.class.name} · {examWindow(exam)}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <Link href={`/super-admin/exams/${exam.id}`} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-medium">
                  View
                </Link>
                <Link
                  href={`/super-admin/exams/${exam.id}/monitor`}
                  className="rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-3 py-2 font-semibold text-white"
                >
                  Monitor
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
