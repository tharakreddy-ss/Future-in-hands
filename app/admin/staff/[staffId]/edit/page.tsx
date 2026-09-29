import { requireSession } from "@/lib/auth";
import { StaffEdit } from "@/components/staff/staff-edit";

export default async function EditStaffPage({ params }: { params: Promise<{ staffId: string }> }) {
  await requireSession(["INSTITUTION_ADMIN"]);
  const { staffId } = await params;
  return <StaffEdit key={staffId} staffId={staffId} />;
}
