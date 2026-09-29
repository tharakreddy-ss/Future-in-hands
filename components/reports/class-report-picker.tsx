"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { ClassReportPickerRow } from "@/services/report.service";

export function ClassReportPicker({ classes }: { classes: ClassReportPickerRow[] }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");

  const years = useMemo(() => [...new Set(classes.map((row) => row.academicYear))].sort(), [classes]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return classes.filter((row) => {
      if (year && row.academicYear !== year) return false;
      if (!needle) return true;
      return [row.name, row.section ?? "", row.groupName, ...row.subjects].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [classes, query, year]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search classes</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by class name, section, group or subject"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
          />
        </label>
        <label className="sm:w-56">
          <span className="sr-only">Filter by academic year</span>
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#11182a] px-3 py-2.5 text-sm text-slate-100 focus:border-violet-400/50 focus:outline-none"
          >
            <option value="">All academic years</option>
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {classes.length} classes
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-slate-400">
          No classes match your search.
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          {filtered.map((row) => (
            <li key={row.id}>
              <Link
                href={`/admin/reports/class/${row.id}`}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {row.name}
                    {row.section ? ` · ${row.section}` : ""}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {row.academicYear} · {row.groupName}
                    {row.subjects.length ? ` · ${row.subjects.join(", ")}` : ""}
                  </p>
                </div>
                <p className="hidden shrink-0 text-right text-xs text-slate-400 sm:block">
                  {row.studentCount} {row.studentCount === 1 ? "student" : "students"} · {row.examCount}{" "}
                  {row.examCount === 1 ? "exam" : "exams"}
                </p>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
