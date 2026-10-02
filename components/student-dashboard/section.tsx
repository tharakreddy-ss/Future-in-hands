import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardSection({
  id,
  title,
  description,
  href,
  linkLabel,
  className,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={cn("min-w-0", className)}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id={id} className="text-xl font-semibold tracking-tight text-white sm:text-[1.375rem]">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
        </div>
        {href && linkLabel ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 rounded-md text-xs font-medium text-violet-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
          >
            {linkLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-white/[0.07] bg-[#0f1629]", className)}>{children}</div>;
}

export function PanelEmpty({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {icon ? <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400">{icon}</span> : null}
      <p className="mt-3 text-sm font-medium text-slate-200">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function RoundAvatar({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex shrink-0 overflow-hidden rounded-full">{children}</span>;
}
