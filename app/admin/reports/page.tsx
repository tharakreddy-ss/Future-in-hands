import Link from "next/link";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const REPORTS = [
  {
    name: "Student Report",
    description: "Individual academic performance, exam history and insights.",
    href: "/admin/reports/student",
  },
  {
    name: "Class Report",
    description: "Class-wide performance, student rankings, exams and insights.",
    href: "/admin/reports/class",
  },
  { name: "Exam Report", description: "Results and statistics for a single exam.", href: null },
  { name: "Subject Report", description: "Performance across a subject.", href: null },
  { name: "Institution Report", description: "Institution-wide academic overview.", href: null },
];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Preview and export academic reports." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {REPORTS.map((report) => (
          <Card key={report.name} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">{report.name}</p>
                {report.href ? null : <Badge tone="slate">Coming soon</Badge>}
              </div>
              <p className="mt-1 text-sm text-slate-400">{report.description}</p>
            </div>
            {report.href ? (
              <Link
                href={report.href}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)] hover:brightness-110"
              >
                Open
              </Link>
            ) : (
              <Button variant="outline" disabled className="shrink-0">
                Open
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
