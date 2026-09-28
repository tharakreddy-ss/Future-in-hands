import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { examService } from "@/services/exam.service";
import { ExamList } from "@/components/exams/exam-list";
import { PageHeader } from "@/components/layout/skeleton";

export default async function AdminExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const { tab = "upcoming" } = await searchParams;
  const exams = await examService.list(requireTenant(user));
  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Scheduled classroom and individual exams."
      />
      <ExamList exams={exams} tab={tab} basePath="/admin" />
    </div>
  );
}
