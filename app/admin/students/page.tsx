import { requireSession } from "@/lib/auth";
import { StudentsSearch } from "@/components/students/students-search";

export default async function StudentsPage() {
  await requireSession(["INSTITUTION_ADMIN"]);
  return <StudentsSearch basePath="/admin" />;
}
