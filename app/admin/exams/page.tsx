import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { examService } from "@/services/exam.service";
import { ExamList } from "@/components/exams/exam-list";
import { PageHeader } from "@/components/layout/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        subtitle="Create, schedule, and monitor assessments."
        actions={
          <Link href="/admin/generate">
            <Button>+ Create Exam</Button>
          </Link>
        }
      />
      <ExamList exams={exams} tab={tab} basePath="/admin" />
    </div>
  );
}
