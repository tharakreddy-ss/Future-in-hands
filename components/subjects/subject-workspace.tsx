"use client";

import { useMemo, useState } from "react";
import { SyllabusForm } from "@/components/syllabus/syllabus-form";

type Classroom = { id: string; name: string; subject: string; academicYear: string; groupName: string; section: string | null; _count: { tests: number } };
export function SubjectWorkspace({ classes }: { classes: Classroom[] }) {
  const [classId, setClassId] = useState(classes[0]?.id ?? ""); const selected = useMemo(() => classes.find((row) => row.id === classId), [classes, classId]);
  if (!classes.length) return <div className="rounded-2xl border border-dashed border-white/15 bg-[#11182A] p-8 text-sm text-slate-400">Create a classroom first. Subject sources are kept with the class that will use them for question generation.</div>;
  return <div className="grid gap-5 xl:grid-cols-[300px_1fr]"><aside className="rounded-2xl border border-white/[0.08] bg-[#11182A] p-3"><p className="px-2 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Choose classroom</p><div className="space-y-1">{classes.map((row) => <button key={row.id} type="button" onClick={() => setClassId(row.id)} className={`w-full rounded-xl p-3 text-left ${row.id === classId ? "bg-violet-500/14 ring-1 ring-violet-400/30" : "hover:bg-white/[0.05]"}`}><span className="block text-sm font-semibold text-white">{row.name}</span><span className="mt-1 block text-xs text-slate-500">{row.academicYear} · {row.groupName}{row.section ? ` · ${row.section}` : ""}</span><span className="mt-1 block text-xs text-violet-300">{row.subject} · {row._count.tests} exams</span></button>)}</div></aside><div>{selected ? <SyllabusForm classId={selected.id} /> : null}</div></div>;
}
