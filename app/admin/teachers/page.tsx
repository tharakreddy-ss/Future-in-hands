import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireTenant } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeachersPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const teachers = await db.user.findMany({
    where: { institutionId: requireTenant(user)!, role: { in: ["TEACHER", "INSTITUTION_ADMIN"] } },
    orderBy: { name: "asc" },
  });
  return (
    <div>
      <PageHeader title="Teachers" subtitle="Staff with teaching or admin access." />
      <div className="mt-6 space-y-3">
        {teachers.map((row) => (
          <Card key={row.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{row.name}</p>
              <p className="text-sm text-slate-400">{row.email}</p>
            </div>
            <Badge tone="purple">{row.role}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
