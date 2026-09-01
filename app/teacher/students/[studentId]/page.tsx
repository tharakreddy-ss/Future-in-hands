import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { studentService } from "@/services/student.service";
import { StudentProfileView } from "@/components/students/student-profile-view";
import { notFound } from "next/navigation";

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const user = await requireSession(["TEACHER"]);
  const { studentId } = await params;
  const profile = await studentService.profile(studentId);
  if (!profile) notFound();
  const raw = await studentService.get(studentId);
  if (!raw || raw.institutionId !== requireTenant(user)) notFound();
  return <StudentProfileView basePath="/teacher" profile={profile} />;
}
