import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { classService } from "@/services/class.service";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";

export default async function SubjectsPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const classes = await classService.list(requireTenant(user)!);
  const grouped = classes.reduce<Record<string, typeof classes>>((acc, cls) => {
    acc[cls.subject] ??= [];
    acc[cls.subject]!.push(cls);
    return acc;
  }, {});
  return (
    <div>
      <PageHeader title="Subjects" subtitle="Subjects linked to your classrooms and syllabi." />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {Object.entries(grouped).map(([name, rows]) => (
          <Card key={name}>
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="mt-2 text-sm text-slate-400">
              {rows.length} classes · {rows.reduce((sum, row) => sum + row._count.tests, 0)} exams
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
