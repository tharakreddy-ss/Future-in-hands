import { db } from "@/lib/db";

export default async function AdminsPage() {
  const admins = await db.user.findMany({
    where: { role: "INSTITUTION_ADMIN" },
    include: { institution: true },
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold">Institution admins</h1>
      <ul className="mt-6 divide-y rounded-2xl border bg-white">
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
