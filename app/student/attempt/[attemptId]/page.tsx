import { ExamRunner } from "@/components/examination/exam-runner";

export default async function AttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <ExamRunner attemptId={attemptId} />;
}
