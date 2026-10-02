import { Skeleton } from "@/components/layout/skeleton";

export function PortalLoading() {
  return (
    <div aria-busy="true" aria-label="Loading workspace" className="space-y-7">
      <div className="rounded-[1.5rem] border border-white/[0.08] bg-white/[0.025] px-5 py-6 sm:px-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-8 w-56" />
        <Skeleton className="mt-3 h-4 max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}
