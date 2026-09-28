import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/skeleton";
import { PracticeSetup } from "@/components/practice/practice-setup";
import { practiceService } from "@/services/practice.service";

export default async function StudentPracticePage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  const classes = await practiceService.setupForStudent(user.studentId);
  return (
    <div>
      <PageHeader
        title="Practice"
        subtitle="Learn with a short quiz from your enrolled class. This is not an official exam."
      />
      <PracticeSetup classes={classes} aiAvailable={practiceService.aiAvailable()} />
    </div>
  );
}
