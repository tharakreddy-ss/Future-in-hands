import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { resultService } from "@/services/result.service";
import { studentService } from "@/services/student.service";
import { ResultSummary } from "@/components/results/result-summary";
import { formatPercent } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export default async function StaffStudentResultPage({
  params,
}: {
  params: Promise<{ studentId: string; attemptId: string }>;
}) {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const { studentId, attemptId } = await params;
  const student = await studentService.get(studentId);
  if (!student || student.institutionId !== requireTenant(user)) notFound();
  const result = await resultService.getByAttempt(attemptId);
  if (!result || result.studentId !== studentId) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Link href={`/admin/students/${studentId}`} className="text-sm text-slate-400 hover:text-white">
        Back to profile
      </Link>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Exam result</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">{result.test.title}</h1>
        <p className="mt-1 text-slate-400">
          {student.firstName} {student.lastName} · {student.studentIdentifier} · {formatPercent(result.percentage)}
        </p>
      </div>
      <ResultSummary
        score={result.score}
        maxScore={result.totalQuestions}
        percentage={result.percentage}
        topics={[]}
      />
      <Card className="text-sm text-slate-300">
        <p>Correct: {result.correctAnswers}</p>
        <p>Incorrect: {result.wrongAnswers}</p>
        <p>Unattempted: {result.unansweredQuestions}</p>
      </Card>
    </div>
  );
}
