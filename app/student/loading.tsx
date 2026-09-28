import { PageHeader, Skeleton, StatSkeleton } from "@/components/layout/skeleton";

export default function StudentLoading() {
  return (
    <div>
      <PageHeader title="Loading…" subtitle="Fetching your student workspace." />
      <div className="mt-5">
        <StatSkeleton />
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}
