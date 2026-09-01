import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { questionService } from "@/services/question.service";
import { classService } from "@/services/class.service";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";
import { Badge } from "@/components/ui/badge";

export default async function TeacherQuestionsPage() {
  const user = await requireSession(["TEACHER"]);
  const classes = await classService.list(requireTenant(user)!);
  const questions = (await Promise.all(classes.map((cls) => questionService.list(cls.id)))).flat();
  return (
    <div>
      <PageHeader title="Question Bank" />
      <div className="mt-6 space-y-3">
        {questions.slice(0, 40).map((q) => (
          <Card key={q.id} className="flex justify-between gap-3">
            <p className="text-sm">{q.questionText}</p>
            <Badge tone="purple">{q.difficulty}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
