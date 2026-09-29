import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/layout/skeleton";
import { StaffForm } from "@/components/staff/staff-form";

export default async function NewStaffPage() {
  await requireSession(["INSTITUTION_ADMIN"]);
  return (
    <div className="space-y-6">
      <Link href="/admin/staff" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Staff
      </Link>
      <PageHeader
        eyebrow="Staff"
        title="Add Staff"
        subtitle="Create a staff record. This does not create a login account."
      />
      <StaffForm />
    </div>
  );
}
