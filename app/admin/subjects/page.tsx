import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { classService } from "@/services/class.service";
import { SubjectWorkspace } from "@/components/subjects/subject-workspace";
import { PageHeader } from "@/components/layout/skeleton";

export default async function SubjectsPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const classes = await classService.list(requireTenant(user)!);
  return (
    <div>
      <PageHeader title="Subject sources" subtitle="Add a topic, paste text, or upload an image/PDF. Review the extracted content before AI uses it for questions." />
      <div className="mt-6"><SubjectWorkspace classes={classes} /></div>
    </div>
  );
}
