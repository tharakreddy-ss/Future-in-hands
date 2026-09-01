import { requireSession } from "@/lib/auth";
import { examService } from "@/services/exam.service";
import { examWindow } from "@/lib/exam-window";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function SuperAdminExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  await requireSession(["SUPER_ADMIN"]);
  const { examId } = await params;
  const exam = await examService.get(examId);
  if (!exam) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-violet-300">{examWindow(exam)}</p>
        <h1 className="mt-2 text-3xl font-semibold">{exam.title}</h1>
        <p className="text-slate-500">
          {exam.institution.name} · {exam.class.name}
        </p>
      </div>
      <Link href={`/super-admin/exams/${exam.id}/monitor`} className="inline-flex rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2 text-sm text-white">
        Monitor live
      </Link>
      <Card>
        <p>{exam._count.assignments} assignments · {exam.papers.length} papers</p>
      </Card>
    </div>
  );
}
