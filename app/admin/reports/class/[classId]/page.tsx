import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ClassReport } from "@/components/reports/class-report";
import { PrintButton } from "@/components/reports/print-button";
import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { reportService } from "@/services/report.service";

export default async function ClassReportPage({ params }: { params: Promise<{ classId: string }> }) {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const { classId } = await params;
  const report = await reportService.classReport(classId, requireTenant(user)!);
  if (!report) notFound();

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/reports/class"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Choose another class
        </Link>
        <PrintButton />
      </div>
      <ClassReport report={report} />
    </div>
  );
}
