import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";
import { formatDate, formatPercent } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function StudentResultsIndexPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const attempts = await db.studentTestAttempt.findMany({
    where: { studentId: user.studentId, status: "SUBMITTED" },
    include: { test: { include: { class: true } } },
    orderBy: { submittedAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="Results" subtitle="Submitted exams only. Open a result to review each question." />
      <div className="mt-6 space-y-3">
        {attempts.length === 0 ? (
          <EmptyState
            title="No results yet"
            description="Completed exams will appear here after you submit."
            actionHref="/student/tests"
            actionLabel="View exams"
          />
        ) : (
          attempts.map((row) => (
            <Link key={row.id} href={`/student/results/${row.id}`} className="block">
              <Card className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">{row.test.title}</p>
                  <p className="text-sm text-slate-500">
                    {row.test.class.name}
                    {row.submittedAt ? ` · ${formatDate(row.submittedAt)}` : ""}
                  </p>
                </div>
                <span className="text-violet-300">{formatPercent(row.percentage)}</span>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
