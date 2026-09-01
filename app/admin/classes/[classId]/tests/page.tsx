import { questionService } from "@/services/question.service";
import { testService } from "@/services/test.service";
import { TestCard } from "@/components/tests/test-card/test-card";
import { TestWizard } from "@/components/tests/test-wizard/test-wizard";
import { TestPreview } from "@/components/tests/test-preview/test-preview";

export default async function ClassTestsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const [tests, questions] = await Promise.all([
    testService.list(classId),
    questionService.list(classId),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {tests.map((test) => (
          <TestCard
            key={test.id}
            title={test.title}
            status={test.status}
            durationMinutes={test.durationMinutes}
            questionCount={test.questions.length}
          />
        ))}
        {tests.length === 0 ? <p className="text-sm text-slate-500">No tests yet.</p> : null}
      </div>
      <div className="space-y-6">
        <TestWizard classId={classId} questionIds={questions.map((q) => q.id)} />
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
