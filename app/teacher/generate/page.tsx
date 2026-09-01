import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { classService } from "@/services/class.service";
import { GenerateHub } from "@/components/exams/generate-hub";

export default async function TeacherGeneratePage() {
  const user = await requireSession(["TEACHER"]);
  const classes = await classService.list(requireTenant(user)!);
  return <GenerateHub basePath="/teacher" classes={classes.map((c) => ({ id: c.id, name: c.name }))} />;
}
