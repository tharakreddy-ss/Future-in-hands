import { ResourceForm, InstitutionStatusButton } from "@/components/management/resource-form";
import { requireSession } from "@/lib/auth";
import { institutionService } from "@/services/institution.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function InstitutionsPage() {
  await requireSession(["SUPER_ADMIN"]);
  const institutions = await institutionService.list();
  return (
    <div>
      <h1 className="text-2xl font-semibold">Institutions</h1>
      <ResourceForm title="Create institution" endpoint="/api/institutions" fields={[{ name: "name", label: "Institution name" }, { name: "email", label: "Email", type: "email", optional: true }, { name: "phone", label: "Phone", optional: true }]} />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {institutions.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between">
              <h2 className="font-semibold">{item.name}</h2>
              <Badge tone={item.status === "ACTIVE" ? "green" : "amber"}>{item.status}</Badge>
            </div>
            <p className="text-sm text-slate-500">{item.email}</p>
            <p className="mt-2 text-sm">
              {item._count.students} students · {item._count.classes} classes · {item._count.tests} tests
            </p>
            <div className="mt-4"><InstitutionStatusButton id={item.id} active={item.status === "ACTIVE"} /></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
