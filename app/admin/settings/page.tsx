import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function AdminSettingsPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  return (
    <div>
      <PageHeader title="Settings" subtitle="General, exam, notification, and security preferences." />
      <Card className="mt-6 max-w-xl space-y-4">
        <p className="text-sm text-slate-400">Signed in as {user.email}</p>
        <label className="block text-sm text-slate-400">
          Institution display name
          <Input className="mt-1" defaultValue="Demo Academy" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" defaultChecked /> Show results immediately after submit
        </label>
      </Card>
    </div>
  );
}
