import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";

export default function SuperAdminSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" />
      <Card className="mt-6 max-w-lg text-sm text-slate-400">Platform branding, integrations, and security defaults.</Card>
    </div>
  );
}
