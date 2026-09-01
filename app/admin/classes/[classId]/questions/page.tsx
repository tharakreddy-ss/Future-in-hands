import { questionService } from "@/services/question.service";
import { QuestionCard } from "@/components/questions/question-card";
import { GenerateQuestionsButton } from "@/components/questions/generate-button";

export default async function ClassQuestionsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const questions = await questionService.list(classId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Question bank</h2>
        <GenerateQuestionsButton classId={classId} />
      </div>
      <div className="space-y-3">
        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            stem={question.questionText}
            difficulty={question.difficulty}
            source={question.source}
          />
        ))}
        {questions.length === 0 ? (
          <p className="text-sm text-slate-500">No questions yet. Generate from the syllabus.</p>
        ) : null}
      </div>
    </div>
  );
}
