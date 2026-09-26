import { requireSession } from "@/lib/auth";
import { requireClassAccess } from "@/lib/resource-access";
import { syllabusService } from "@/services/syllabus.service";
import { SyllabusPanel } from "@/components/syllabus/syllabus-panel";
import { SyllabusForm } from "@/components/syllabus/syllabus-form";

export default async function ClassSyllabusPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  await requireClassAccess(await requireSession(["INSTITUTION_ADMIN", "TEACHER"]), classId);
  const items = await syllabusService.list(classId);
  return (
    <div className="space-y-6">
      <SyllabusForm classId={classId} />
      {items.map((item) => (
        <SyllabusPanel
          key={item.id}
          title={item.title}
          content={item.content}
          analyzedJson={item.analyzedJson}
        />
      ))}
    </div>
  );
}
