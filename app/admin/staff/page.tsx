import { requireSession } from "@/lib/auth";
import { StaffDirectory } from "@/components/staff/staff-directory";

export default async function AdminStaffPage() {
  await requireSession(["INSTITUTION_ADMIN"]);
  return <StaffDirectory />;
}
