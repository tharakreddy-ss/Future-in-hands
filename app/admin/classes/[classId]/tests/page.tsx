import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { requireClassAccess } from "@/lib/resource-access";
import { questionService } from "@/services/question.service";
import { testService } from "@/services/test.service";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TestPreview } from "@/components/tests/test-preview/test-preview";
import { formatDate } from "@/lib/utils";

const statusTone = { LIVE: "green", SCHEDULED: "teal", CLOSED: "slate", DRAFT: "amber" } as const;

export default async function ClassTestsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  await requireClassAccess(await requireSession(["INSTITUTION_ADMIN", "TEACHER"]), classId);
  const [tests, questions] = await Promise.all([
    testService.list(classId),
    questionService.list(classId),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {tests.map((test) => (
          <Link key={test.id} href={`/admin/exams/${test.id}`} className="block">
            <Card className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{test.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {test.durationMinutes} min · {test.totalQuestions} questions
                  {test.startAt ? ` · ${formatDate(test.startAt)}` : ""}
                </p>
              </div>
              <Badge tone={statusTone[test.examStatus]}>{test.examStatus}</Badge>
            </Card>
          </Link>
        ))}
        {tests.length === 0 ? <p className="text-sm text-slate-500">No exams yet.</p> : null}
      </div>
      <div className="space-y-6">
        <Card className="space-y-3">
          <h3 className="font-semibold">Schedule an exam</h3>
          <p className="text-sm text-slate-400">
            Create a scheduled exam for this classroom with question generation, paper variations and automatic assignment.
          </p>
          <Link
            href={`/admin/exams/new?classId=${classId}`}
            className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Create Exam
          </Link>
        </Card>
        {questions.length > 0 ? (
          <TestPreview
            title="Question bank preview"
            questions={questions.slice(0, 8).map((q) => ({ stem: q.questionText }))}
          />
        ) : null}
      </div>
    </div>
  );
}
