import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/reports/print-button";
import { StudentReport } from "@/components/reports/student-report";
import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { reportService } from "@/services/report.service";

export default async function StudentReportPage({ params }: { params: Promise<{ studentId: string }> }) {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const { studentId } = await params;
  const report = await reportService.studentReport(studentId, requireTenant(user)!);
  if (!report) notFound();

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/reports/student"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Choose another student
        </Link>
        <PrintButton />
      </div>
      <StudentReport report={report} />
    </div>
  );
}
