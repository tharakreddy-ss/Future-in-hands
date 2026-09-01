import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { classService } from "@/services/class.service";
import { GenerateHub } from "@/components/exams/generate-hub";

export default async function AdminGeneratePage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const classes = await classService.list(requireTenant(user)!);
  return <GenerateHub basePath="/admin" classes={classes.map((c) => ({ id: c.id, name: c.name }))} />;
}
