import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";

export default async function AdminSettingsPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const institution = user.institutionId
    ? await db.institution.findUnique({ where: { id: user.institutionId } })
    : null;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account details for this institution." />
      <Card className="mt-6 max-w-xl space-y-4">
        <div>
          <p className="text-sm text-slate-400">Signed in as</p>
          <p className="mt-1 text-sm text-white">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Institution</p>
          <p className="mt-1 text-sm text-white">{institution?.name ?? "—"}</p>
        </div>
      </Card>
    </div>
  );
}
