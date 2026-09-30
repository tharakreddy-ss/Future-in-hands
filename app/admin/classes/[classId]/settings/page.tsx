import { requireSession } from "@/lib/auth";
import { requireClassAccess } from "@/lib/resource-access";
import { classService } from "@/services/class.service";
import { notFound } from "next/navigation";
import { ClassSettingsForm } from "@/components/classes/class-settings-form";

export default async function ClassSettingsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  await requireClassAccess(await requireSession(["INSTITUTION_ADMIN", "TEACHER"]), classId);
  const cls = await classService.get(classId);
  if (!cls) notFound();

  return (
    <ClassSettingsForm
      initial={{
        id: cls.id,
        name: cls.name,
        description: cls.description,
        academicYear: cls.academicYear,
        groupName: cls.groupName,
        section: cls.section,
        subject: cls.subject,
        subjectIds: cls.subjects.map((row) => row.subject.id),
      }}
    />
  );
}
