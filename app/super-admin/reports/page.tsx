import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";

export default function SuperAdminReportsPage() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Platform-wide exports." />
      <Card className="mt-6">Institution, usage, and exam activity reports will export from live data.</Card>
    </div>
  );
}
