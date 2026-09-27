import { ResourceForm } from "@/components/management/resource-form";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminsPage() {
  await requireSession(["SUPER_ADMIN"]);
  const institutions = await db.institution.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true } });
  const admins = await db.user.findMany({
    where: { role: "INSTITUTION_ADMIN" },
    include: { institution: true },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Institution admins</h1>
      <ResourceForm title="Create institution admin" endpoint="/api/super-admin/admins" fields={[{ name: "name", label: "Name" }, { name: "email", label: "Email", type: "email" }, { name: "password", label: "Initial password", type: "password" }, { name: "institutionId", label: "Institution", options: institutions.map((i) => ({ value: i.id, label: i.name })) }]} />
      <ul className="mt-6 divide-y rounded-2xl border-white/10 bg-[#11182A]">
        {admins.map((admin) => (
          <li key={admin.id} className="px-4 py-3">
            <p className="font-medium">{admin.name}</p>
            <p className="text-sm text-slate-500">
              {admin.email} · {admin.institution?.name}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
