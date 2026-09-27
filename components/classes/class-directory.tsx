"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, Layers3, Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

export type DirectoryClass = {
  id: string;
  name: string;
  subject: string;
  academicYear: string;
  groupName: string;
  section: string | null;
  program: string | null;
  _count: { enrollments: number; tests: number };
};

export function ClassDirectory({ classes, initialYear }: { classes: DirectoryClass[]; initialYear?: string }) {
  const [year, setYear] = useState(initialYear && YEARS.includes(initialYear as (typeof YEARS)[number]) ? initialYear : "All years");
  const [query, setQuery] = useState("");
  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return classes.filter((row) => (year === "All years" || row.academicYear === year) && (!needle || [row.name, row.subject, row.groupName, row.section, row.program].filter(Boolean).some((value) => value!.toLowerCase().includes(needle))));
  }, [classes, query, year]);
  const suggestions = query.trim() ? matching.slice(0, 6) : [];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Academic structure</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Classrooms</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Organize every batch under its academic year, group and section. Open a classroom to manage students, syllabus, questions and exams.</p>
        </div>
        <Link href="/admin/classes/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)]">
          <Plus className="h-4 w-4" /> Create classroom
        </Link>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#11182A] p-4 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.7)]">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by class, group, section or subject…" className="pl-10" />
            {suggestions.length > 0 ? <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0B1020] p-1.5 shadow-2xl">
              <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Suggested classrooms</p>
              {suggestions.map((row) => <Link key={row.id} href={`/admin/classes/${row.id}/overview`} className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-white/[0.07]">
                <span><span className="block font-medium text-white">{row.name}</span><span className="block text-xs text-slate-500">{row.academicYear} · {row.groupName}{row.section ? ` · ${row.section}` : ""}</span></span><ChevronRight className="h-4 w-4 text-violet-300" />
              </Link>)}
            </div> : null}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["All years", ...YEARS].map((item) => <button key={item} type="button" onClick={() => setYear(item)} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${year === item ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/35" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{item}</button>)}
          </div>
        </div>
      </div>

      {YEARS.filter((academicYear) => year === "All years" || academicYear === year).map((academicYear) => {
        const rows = matching.filter((row) => row.academicYear === academicYear);
        const groups = new Map<string, DirectoryClass[]>();
        rows.forEach((row) => groups.set(row.groupName, [...(groups.get(row.groupName) ?? []), row]));
        return <section key={academicYear} className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#151D31] to-[#0D1324]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><Layers3 className="h-5 w-5" /></span><div><h2 className="font-semibold text-white">{academicYear}</h2><p className="text-xs text-slate-500">{rows.length} {rows.length === 1 ? "classroom" : "classrooms"} · {rows.reduce((sum, row) => sum + row._count.enrollments, 0)} students</p></div></div>
            <Link href={`/admin/classes/new?year=${encodeURIComponent(academicYear)}`} className="text-sm font-medium text-violet-300 hover:text-white">Add to {academicYear}</Link>
          </div>
          {groups.size === 0 ? <div className="px-5 py-8 text-sm text-slate-500">No classrooms in this year yet. Create the first group and section.</div> : <div className="grid gap-4 p-4 xl:grid-cols-2">{[...groups.entries()].map(([groupName, groupRows]) => <div key={groupName} className="rounded-2xl border border-white/[0.08] bg-[#0B1020]/55 p-4">
            <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">Group</p><h3 className="mt-1 font-semibold text-white">{groupName}</h3></div><span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-400">{groupRows.length} classes</span></div>
            <div className="space-y-2">{groupRows.map((row) => <Link key={row.id} href={`/admin/classes/${row.id}/overview`} className="group flex items-center gap-3 rounded-xl border border-transparent bg-white/[0.035] p-3 transition hover:border-violet-400/25 hover:bg-violet-500/[0.06]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-300"><BookOpen className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{row.name}{row.section ? ` · ${row.section}` : ""}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{row.subject}{row.program ? ` · ${row.program}` : ""}</span></span><span className="hidden text-right text-xs text-slate-500 sm:block"><span className="flex items-center justify-end gap-1"><Users className="h-3 w-3" /> {row._count.enrollments}</span><span>{row._count.tests} exams</span></span><ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:text-violet-300" /></Link>)}</div>
          </div>)}</div>}
        </section>;
      })}
    </div>
  );
}
