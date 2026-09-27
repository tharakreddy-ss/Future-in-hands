import { Card } from "@/components/ui/card";
import { Activity, BookOpen, CheckCircle2, GraduationCap, Trophy, Users } from "lucide-react";

function MetricIcon({ label }: { label: string }) {
  const className = "h-4 w-4";
  const key = label.toLowerCase();
  if (key.includes("student")) return <Users className={className} />;
  if (key.includes("class")) return <GraduationCap className={className} />;
  if (key.includes("score")) return <Trophy className={className} />;
  if (key.includes("completion") || key.includes("attempt")) return <CheckCircle2 className={className} />;
  if (key.includes("exam") || key.includes("test")) return <BookOpen className={className} />;
  return <Activity className={className} />;
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="group min-h-[132px] overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200/85 sm:text-xs">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/15 bg-violet-500/10 text-violet-200 shadow-[0_0_24px_rgba(124,58,237,0.12)] transition group-hover:scale-110 group-hover:bg-violet-500/20"><MetricIcon label={label} /></span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3"><p className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">{value}</p><span className="mb-1 h-1.5 w-12 overflow-hidden rounded-full bg-white/8"><span className="block h-full w-2/3 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" /></span></div>
      {hint ? <p className="mt-2 truncate text-xs text-slate-500">{hint}</p> : <p className="mt-2 text-[11px] text-slate-500">Live institute data</p>}
    </Card>
  );
}
