import { requireSession } from "@/lib/auth";
import { SubjectLibrary } from "@/components/subjects/subject-library";

export default async function SubjectsPage() {
  await requireSession(["INSTITUTION_ADMIN"]);
  return <SubjectLibrary />;
}
