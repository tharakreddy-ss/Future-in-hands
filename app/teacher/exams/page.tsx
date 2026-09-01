import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { examService } from "@/services/exam.service";
import { ExamList } from "@/components/exams/exam-list";
import { PageHeader } from "@/components/layout/skeleton";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TeacherExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireSession(["TEACHER"]);
  const { tab = "upcoming" } = await searchParams;
  const exams = await examService.list(requireTenant(user));
  return (
    <div>
      <PageHeader
        title="Exams"
        actions={
          <Link href="/teacher/generate">
            <Button>+ Create Exam</Button>
          </Link>
        }
      />
      <ExamList exams={exams} tab={tab} basePath="/teacher" />
    </div>
  );
}
