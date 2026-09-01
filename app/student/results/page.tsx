import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { EmptyState } from "@/components/layout/empty-state";

export default async function StudentResultsIndexPage() {
  const user = await requireSession(["STUDENT"]);
  const attempts = await db.studentTestAttempt.findMany({
    where: { studentId: user.studentId!, status: "SUBMITTED" },
    include: { test: true },
    orderBy: { submittedAt: "desc" },
  });
  return (
    <div>
      <PageHeader title="Results" />
      <div className="mt-6 space-y-3">
        {attempts.length === 0 ? (
          <EmptyState title="No results yet" description="Completed exams will appear here." />
        ) : (
          attempts.map((row) => (
            <Link key={row.id} href={`/student/results/${row.id}`}>
              <Card className="flex justify-between">
                <span>{row.test.title}</span>
                <span className="text-violet-300">{Math.round(row.percentage)}%</span>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
