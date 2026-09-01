import Link from "next/link";
import { Sparkles } from "lucide-react";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-[#11182A]/70 px-8 py-16 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Sparkles className="h-4 w-4" />
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
