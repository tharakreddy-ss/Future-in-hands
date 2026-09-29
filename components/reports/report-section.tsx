import { cn } from "@/lib/utils";

export function ReportSection({
  title,
  children,
  className,
  allowBreak = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  allowBreak?: boolean;
}) {
  return (
    <section className={cn(!allowBreak && "break-inside-avoid", className)}>
      <h2 className="mb-3 break-after-avoid border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
        {title}
      </h2>
      {children}
    </section>
  );
}
