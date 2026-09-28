import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/skeleton";
import { PracticeRunner } from "@/components/practice/practice-runner";

export default async function StudentPracticeRunPage() {
  await requireSession(["STUDENT"]);
  return (
    <div>
      <PageHeader
        title="Practice quiz"
        subtitle="Check each answer before moving on. Refreshing may end this session."
      />
      <PracticeRunner />
    </div>
  );
}
