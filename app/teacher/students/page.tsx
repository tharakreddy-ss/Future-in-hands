import { requireSession } from "@/lib/auth";
import { StudentsSearch } from "@/components/students/students-search";

export default async function TeacherStudentsPage() {
  await requireSession(["TEACHER"]);
  return <StudentsSearch basePath="/teacher" />;
}
