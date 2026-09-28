import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/skeleton";

export function GenerateHub({
  classes,
}: {
  classes: Array<{ id: string; name: string; href: string }>;
}) {
  return (
    <div>
      <PageHeader
        eyebrow="Exams"
        title="Create an exam from a classroom"
        subtitle="Open a classroom to create an exam for the class, or open a student report to assign an exam to one student."
      />
      {classes.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">No classrooms yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {classes.map((item) => (
            <Link key={item.id} href={item.href}>
              <Card className="h-full">
                <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                <p className="mt-2 text-sm text-violet-300">Open classroom</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
