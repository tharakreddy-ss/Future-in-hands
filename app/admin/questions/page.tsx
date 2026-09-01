import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { questionService } from "@/services/question.service";
import { classService } from "@/services/class.service";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function QuestionBankPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const classes = await classService.list(requireTenant(user)!);
  const questions = (
    await Promise.all(classes.map((cls) => questionService.list(cls.id)))
  ).flat();

  return (
    <div>
      <PageHeader
        title="Question Bank"
        subtitle="Search, filter, and reuse validated items."
        actions={
          <Link href="/admin/generate">
            <Button>AI Generate</Button>
          </Link>
        }
      />
      {questions.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No questions found."
            description="Generate syllabus-aware MCQs to populate your bank."
            actionHref="/admin/generate"
            actionLabel="Generate Questions with AI"
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {questions.slice(0, 40).map((q) => (
            <Card key={q.id} className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-3xl">
                <p className="text-sm text-white">{q.questionText}</p>
                <p className="mt-2 text-xs text-slate-500">Usage {q.usageCount}</p>
              </div>
              <Badge tone="purple">{q.difficulty}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
