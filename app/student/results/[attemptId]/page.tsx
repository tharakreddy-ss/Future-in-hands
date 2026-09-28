import { requireSession } from "@/lib/auth";
import { resultService, reviewFromAttempt } from "@/services/result.service";
import { notFound } from "next/navigation";
import { ResultSummary } from "@/components/results/result-summary";
import { QuestionReview } from "@/components/results/question-review";
import { ScoreBars } from "@/components/analytics/score-bars";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";
import { formatDate, formatPercent } from "@/lib/utils";
import Link from "next/link";

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (!minutes) return `${rest}s`;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const user = await requireSession(["STUDENT"]);
  const result = await resultService.getByAttempt(attemptId);
  if (!result || result.status !== "SUBMITTED" || result.studentId !== user.studentId) notFound();

  const { items, topics } = reviewFromAttempt(result);
  const submitted = result.submittedAt ?? result.startedAt;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={result.test.title}
        subtitle={`${result.test.class.name}${result.test.class.subject ? ` · ${result.test.class.subject}` : ""}`}
      />
      <p className="text-sm text-slate-400">
        Submitted {formatDate(submitted)}
        {result.timeTakenSeconds > 0 ? ` · Time taken ${formatDuration(result.timeTakenSeconds)}` : ""}
        {` · ${formatPercent(result.percentage)}`}
      </p>
      <ResultSummary
        score={result.score}
        maxScore={result.totalQuestions}
        percentage={result.percentage}
        topics={topics}
      />
      <Card className="text-sm text-slate-300">
        <p>Correct answers: {result.correctAnswers}</p>
        <p>Incorrect answers: {result.wrongAnswers}</p>
        <p>Unanswered: {result.unansweredQuestions}</p>
      </Card>
      {topics.length > 0 ? (
        <Card>
          <h2 className="text-lg font-semibold text-white">Topic performance</h2>
          <p className="mt-1 text-sm text-slate-400">Share of questions correct in each labeled topic.</p>
          <div className="mt-4">
            <ScoreBars
              items={topics.map((topic) => ({
                label: `${topic.topic} · ${topic.correct}/${topic.total}`,
                value: topic.total ? (topic.correct / topic.total) * 100 : 0,
              }))}
            />
          </div>
        </Card>
      ) : (
        <Card>
          <h2 className="text-lg font-semibold text-white">Topic performance</h2>
          <p className="mt-3 text-sm text-slate-500">
            Topic breakdown is unavailable because these questions have no topic labels.
          </p>
        </Card>
      )}
      <QuestionReview items={items} />
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/student/results" className="text-violet-300 hover:text-white">
          Back to Results
        </Link>
        <Link href="/student/dashboard" className="text-violet-300 hover:text-white">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
