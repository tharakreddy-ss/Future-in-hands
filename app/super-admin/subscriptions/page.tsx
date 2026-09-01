import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function SubscriptionsPage() {
  const rows = await db.institution.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Subscriptions</h1>
      <ul className="mt-6 divide-y rounded-2xl border bg-white">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{row.name}</p>
              <p className="text-sm text-slate-500">{row.subscriptionPlan}</p>
            </div>
            <Badge tone={row.subscriptionStatus === "ACTIVE" ? "green" : "amber"}>
              {row.subscriptionStatus}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
