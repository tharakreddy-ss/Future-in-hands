import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const REPORTS = ["Student Report", "Class Report", "Exam Report", "Subject Report", "Institution Report"];

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Preview and export academic reports." />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {REPORTS.map((name) => (
          <Card key={name} className="flex items-center justify-between">
            <p className="font-medium">{name}</p>
            <div className="flex gap-2">
              <Button variant="outline">Preview</Button>
              <Button variant="secondary">Download PDF</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
