import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import { ClassReportPicker } from "@/components/reports/class-report-picker";
import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { reportService } from "@/services/report.service";

export default async function ClassReportPickerPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const institutionId = requireTenant(user)!;
  const classes = await reportService.classPicker(institutionId);

  return (
    <div className="space-y-6">
      <Link href="/admin/reports" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Reports
      </Link>
      <PageHeader
        eyebrow="Reports"
        title="Class Report"
        subtitle="Choose a class to preview its academic report. You can print it or save it as a PDF."
      />
      <Card>
        {classes.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-medium text-white">No classes yet</p>
            <p className="mt-1 text-sm text-slate-400">Create a class to generate class reports.</p>
            <Link href="/admin/classes" className="mt-4 inline-block text-sm text-violet-300 hover:text-violet-200">
              Go to Classes →
            </Link>
          </div>
        ) : (
          <ClassReportPicker classes={classes} />
        )}
      </Card>
    </div>
  );
}
