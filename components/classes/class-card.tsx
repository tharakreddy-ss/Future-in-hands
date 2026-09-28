import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export function ClassCard({
  id,
  name,
  subject,
  students,
  tests,
  createdAt,
  classroomHref,
}: {
  id: string;
  name: string;
  subject: string;
  students: number;
  tests: number;
  createdAt: Date | string;
  classroomHref?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">{subject}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">{name}</h3>
      <p className="mt-3 text-sm text-slate-400">
        {students} students · {tests} tests
      </p>
      <p className="mt-1 text-xs text-slate-500">Created {formatDate(createdAt)}</p>
      <div className="mt-5">
        <Link
          href={classroomHref ?? `/admin/classes/${id}/overview`}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200"
        >
          Open Classroom
        </Link>
      </div>
    </Card>
  );
}
