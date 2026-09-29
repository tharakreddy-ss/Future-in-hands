"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StudentReportPickerRow } from "@/services/report.service";

export function StudentReportPicker({ students }: { students: StudentReportPickerRow[] }) {
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState("");

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const student of students) {
      for (const cls of student.classes) map.set(cls.id, cls.label);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter((student) => {
      if (classId && !student.classes.some((cls) => cls.id === classId)) return false;
      if (!needle) return true;
      return [student.name, student.studentIdentifier, student.rollNumber ?? ""].some((value) =>
        value.toLowerCase().includes(needle),
      );
    });
  }, [students, query, classId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search students</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, student ID or roll number"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
          />
        </label>
        <label className="sm:w-64">
          <span className="sr-only">Filter by class</span>
          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#11182a] px-3 py-2.5 text-sm text-slate-100 focus:border-violet-400/50 focus:outline-none"
          >
            <option value="">All classes</option>
            {classOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {students.length} students
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center text-sm text-slate-400">
          No students match your search.
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
          {filtered.map((student) => (
            <li key={student.id}>
              <Link
                href={`/admin/reports/student/${student.id}`}
                className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{student.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {student.studentIdentifier}
                    {student.rollNumber ? ` · Roll ${student.rollNumber}` : ""}
                    {student.classes.length
                      ? ` · ${student.classes.map((cls) => cls.label).join(", ")}`
                      : " · Unassigned"}
                  </p>
                </div>
                {student.status === "INACTIVE" ? <Badge tone="slate">Inactive</Badge> : null}
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-500" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
