import { classService } from "@/services/class.service";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";

export default async function ClassSettingsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const cls = await classService.get(classId);
  if (!cls) notFound();

  return (
    <Card className="max-w-xl space-y-2">
      <h2 className="font-semibold">Classroom settings</h2>
      <p className="text-sm text-slate-500">Name</p>
      <p>{cls.name}</p>
      <p className="text-sm text-slate-500">Subject</p>
      <p>{cls.subject}</p>
      <p className="text-sm text-slate-500">Description</p>
      <p>{cls.description ?? "—"}</p>
    </Card>
  );
}
