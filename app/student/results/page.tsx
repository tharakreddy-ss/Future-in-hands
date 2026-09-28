import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";
import { formatDate, formatPercent } from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function StudentResultsIndexPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const attempts = await db.studentTestAttempt.findMany({
    where: { studentId: user.studentId, status: "SUBMITTED" },
    include: { test: { include: { class: true, subject: true } } },
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
          attempts.map((row) => {
            const subject = row.test.subject?.name || row.test.class.subject || null;
            const when = row.submittedAt ?? row.startedAt;
            return (
              <Link key={row.id} href={`/student/results/${row.id}`} className="block">
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{row.test.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {row.test.class.name}
                      {subject ? ` · ${subject}` : ""}
                      {` · ${formatDate(when)}`}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {row.correctAnswers} correct · {row.wrongAnswers} wrong · {row.unansweredQuestions} unanswered
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="purple">
                      {row.score}/{row.totalQuestions}
                    </Badge>
                    <span className="text-lg font-semibold text-violet-300">{formatPercent(row.percentage)}</span>
                  </div>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
