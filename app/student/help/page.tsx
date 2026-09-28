import { requireSession } from "@/lib/auth";
import { studentService } from "@/services/student.service";
import { PageHeader } from "@/components/layout/skeleton";
import { StudentHelp } from "@/components/help/student-help";

export default async function StudentHelpPage() {
  const user = await requireSession(["STUDENT"]);
  let institutionName: string | null = null;
  let institutionEmail: string | null = null;
  let institutionPhone: string | null = null;
  if (user.studentId) {
    const student = await studentService.get(user.studentId);
    institutionName = student?.institution.name ?? null;
    institutionEmail = student?.institution.email ?? null;
    institutionPhone = student?.institution.phone ?? null;
  }

  return (
    <div>
      <PageHeader
        title="Help"
        subtitle="Student guides for exams, results, classes, notifications, and your profile. This is not a staff help page."
      />
      <div className="mt-6">
        <StudentHelp
          institutionName={institutionName}
          institutionEmail={institutionEmail}
          institutionPhone={institutionPhone}
        />
      </div>
    </div>
  );
}
