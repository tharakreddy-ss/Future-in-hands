import { db } from "@/lib/db";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SuperAdminUsersPage() {
  const users = await db.user.findMany({
    where: { role: { not: "SUPER_ADMIN" } },
    include: { institution: true },
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return (
    <div>
      <PageHeader title="Users" subtitle="Admins, teachers, and student accounts." />
      <div className="mt-6 overflow-x-auto rounded-2xl border border-white/8">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Institution</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => (
              <tr key={row.id} className="border-t border-white/8">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3 text-slate-400">{row.email}</td>
                <td className="px-4 py-3">{row.institution?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge tone="purple">{row.role}</Badge>
                </td>
                <td className="px-4 py-3">{row.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
