import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";
import { StudentReportPicker } from "@/components/reports/student-report-picker";
import { requireSession } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { reportService } from "@/services/report.service";

export default async function StudentReportPickerPage() {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  const institutionId = requireTenant(user)!;
  const students = await reportService.studentPicker(institutionId);

  return (
    <div className="space-y-6">
      <Link href="/admin/reports" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Reports
      </Link>
      <PageHeader
        eyebrow="Reports"
        title="Student Report"
        subtitle="Choose a student to preview their academic report. You can print it or save it as a PDF."
      />
      <Card>
        {students.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-medium text-white">No students yet</p>
            <p className="mt-1 text-sm text-slate-400">Add students to your institution to generate reports.</p>
            <Link href="/admin/students" className="mt-4 inline-block text-sm text-violet-300 hover:text-violet-200">
              Go to Students →
            </Link>
          </div>
        ) : (
          <StudentReportPicker students={students} />
        )}
      </Card>
    </div>
  );
}
