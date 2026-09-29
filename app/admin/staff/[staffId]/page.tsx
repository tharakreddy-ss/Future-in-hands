import { requireSession } from "@/lib/auth";
import { StaffProfileView } from "@/components/staff/staff-profile-view";

export default async function StaffDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ staffId: string }>;
  searchParams: Promise<{ created?: string; updated?: string; photoError?: string }>;
}) {
  await requireSession(["INSTITUTION_ADMIN"]);
  const [{ staffId }, query] = await Promise.all([params, searchParams]);
  return (
    <StaffProfileView
      key={staffId}
      staffId={staffId}
      notice={{
        created: query.created === "1",
        updated: query.updated === "1",
        photoError: typeof query.photoError === "string" ? query.photoError.slice(0, 200) : undefined,
      }}
    />
  );
}
