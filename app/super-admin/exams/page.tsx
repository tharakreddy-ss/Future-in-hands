import { requireSession } from "@/lib/auth";
import { examService } from "@/services/exam.service";
import { examWindow } from "@/lib/exam-window";
import { PageHeader } from "@/components/layout/skeleton";
import { PlatformExamWorkspace } from "@/components/exams/platform-exam-workspace";

export default async function SuperAdminExamsPage() {
  await requireSession(["SUPER_ADMIN"]);
  const exams = await examService.list(null);
  const rows = exams.map((exam) => {
    const window = examWindow(exam);
    const state: "DRAFT" | "CLOSED" | "LIVE" | "UPCOMING" = exam.status === "DRAFT" ? "DRAFT" : exam.status === "ARCHIVED" || window === "CLOSED" ? "CLOSED" : window === "LIVE" ? "LIVE" : "UPCOMING";
    return {
      id: exam.id,
      title: exam.title,
      institution: exam.institution.name,
      classroom: exam.class.name,
      state,
      statusLabel: state === "UPCOMING" ? "UPCOMING" : state,
      startAt: exam.startAt?.toISOString() ?? null,
      durationMinutes: exam.durationMinutes,
      questionCount: exam.totalQuestions,
      assignments: exam._count.assignments,
      started: exam.attempts.filter((attempt) => attempt.status !== "NOT_STARTED").length,
      submitted: exam.attempts.filter((attempt) => attempt.status === "SUBMITTED").length,
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Exams"
        subtitle="Track exam schedules and student progress across every institution."
      />
      <PlatformExamWorkspace exams={rows} />
    </div>
  );
}
