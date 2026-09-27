import { requireSession } from "@/lib/auth";
import { requireClassAccess } from "@/lib/resource-access";
import { classService } from "@/services/class.service";
import { notFound } from "next/navigation";
import { ResourceForm } from "@/components/management/resource-form";

export default async function ClassSettingsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  await requireClassAccess(await requireSession(["INSTITUTION_ADMIN", "TEACHER"]), classId);
  const cls = await classService.get(classId);
  if (!cls) notFound();

  return <ResourceForm title="Classroom settings" endpoint={`/api/classes/${classId}`} method="PATCH" fields={[{ name: "name", label: "Class name", value: cls.name }, { name: "subject", label: "Subject", value: cls.subject }, { name: "description", label: "Description", value: cls.description || "", optional: true }]} />;
}
