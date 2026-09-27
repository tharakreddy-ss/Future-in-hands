import { requireSession } from "@/lib/auth";
import { resultService } from "@/services/result.service";
import { notFound } from "next/navigation";
import { ResultSummary } from "@/components/results/result-summary";
import Link from "next/link";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const user = await requireSession(["STUDENT"]);
  const result = await resultService.getByAttempt(attemptId);
  if (!result || result.status !== "SUBMITTED" || result.studentId !== user.studentId) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">TEST RESULT</h1>
      <p className="text-slate-500">{result.test.title}</p>
      <ResultSummary
        score={result.score}
        maxScore={result.totalQuestions}
        percentage={result.percentage}
        topics={[]}
      />
      <div className="rounded-2xl border border-white/8 bg-[#11182A] p-5 text-sm">
        <p>Correct Answers: {result.correctAnswers}</p>
        <p>Wrong Answers: {result.wrongAnswers}</p>
        <p>Unanswered: {result.unansweredQuestions}</p>
      </div>
      <Link href="/student/dashboard" className="inline-block text-violet-300">
        Back to Dashboard
      </Link>
    </div>
  );
}
