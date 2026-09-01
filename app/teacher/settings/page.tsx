import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";

export default async function TeacherSettingsPage() {
  const user = await requireSession(["TEACHER"]);
  return (
    <div>
      <PageHeader title="Settings" />
      <Card className="mt-6 max-w-lg">
        <p className="text-sm text-slate-400">{user.name}</p>
        <p className="text-sm text-slate-500">{user.email}</p>
      </Card>
    </div>
  );
}
