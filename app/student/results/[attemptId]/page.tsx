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

function formatDateTime(value: Date) {
  return value.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-white">{value ?? "Not available"}</dd>
    </div>
  );
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const result = await resultService.getSubmittedForStudent(attemptId, user.studentId);
  if (!result) notFound();

  const { items, topics } = reviewFromAttempt(result);
  const subjectName = result.test.subject?.name || result.test.class.subject || null;
  const totalQuestions = result.totalQuestions;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Submitted result"
        title={result.test.title}
        subtitle={[result.test.class.name, subjectName].filter(Boolean).join(" · ")}
      />

      <section>
        <h2 className="text-lg font-semibold text-white">Score summary</h2>
        <div className="mt-3 space-y-4">
          <ResultSummary
            score={result.score}
            maxScore={totalQuestions}
            percentage={result.percentage}
            topics={[]}
          />
          <Card>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoRow label="Exam" value={result.test.title} />
              <InfoRow label="Class" value={result.test.class.name} />
              <InfoRow label="Subject" value={subjectName} />
              <InfoRow label="Total questions" value={String(totalQuestions)} />
              <InfoRow label="Score" value={`${result.score} / ${totalQuestions}`} />
              <InfoRow label="Percentage" value={formatPercent(result.percentage)} />
              <InfoRow label="Correct" value={String(result.correctAnswers)} />
              <InfoRow label="Wrong" value={String(result.wrongAnswers)} />
              <InfoRow label="Unanswered" value={String(result.unansweredQuestions)} />
            </dl>
            <p className="mt-4 text-xs text-slate-500">
              Score is the number of correct answers. Each question counts as one mark.
            </p>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Exam information</h2>
        <Card className="mt-3">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Exam" value={result.test.title} />
            <InfoRow label="Class" value={result.test.class.name} />
            <InfoRow label="Subject" value={subjectName} />
            <InfoRow
              label="Scheduled exam date"
              value={result.test.examDate ? formatDate(result.test.examDate) : null}
            />
            <InfoRow label="Started" value={formatDateTime(result.startedAt)} />
            <InfoRow
              label="Submitted"
              value={result.submittedAt ? formatDateTime(result.submittedAt) : null}
            />
            <InfoRow
              label="Time taken"
              value={result.timeTakenSeconds > 0 ? formatDuration(result.timeTakenSeconds) : null}
            />
            <InfoRow
              label="Scheduled duration"
              value={`${result.test.durationMinutes} min`}
            />
          </dl>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Topic-wise performance</h2>
        {topics.length > 0 ? (
          <Card className="mt-3">
            <p className="text-sm text-slate-400">From topic labels on this paper’s questions.</p>
            <div className="mt-4">
              <ScoreBars
                items={topics.map((topic) => ({
                  label: `${topic.topic} · ${topic.correct} correct · ${topic.wrong} wrong · ${topic.unanswered} unanswered`,
                  value: topic.total ? (topic.correct / topic.total) * 100 : 0,
                }))}
              />
            </div>
          </Card>
        ) : (
          <Card className="mt-3">
            <p className="text-sm text-slate-500">
              Topic-wise analysis is unavailable for this test because topic information was not provided.
            </p>
          </Card>
        )}
      </section>

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
