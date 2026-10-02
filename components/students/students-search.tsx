"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StudentForm } from "@/components/students/student-form";
import { StudentImageReveal } from "@/components/students/student-image-reveal";
import type { StudentHit } from "@/components/students/types";

export function StudentsSearch({ basePath }: { basePath: "/admin" | "/teacher" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [classId, setClassId] = useState("all");
  const [students, setStudents] = useState<StudentHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/students");
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error("Could not load students.");
      setStudents(data);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const student of students) {
      for (const classroom of student.classes ?? []) {
        const section = classroom.section ? `-${classroom.section}` : "";
        map.set(classroom.id, `${classroom.name}${section}`);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [students]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter((student) => {
      const inClass = classId === "all" || (student.classes ?? []).some((classroom) => classroom.id === classId);
      if (!inClass) return false;
      if (!needle) return true;
      return [student.name, student.studentIdentifier, student.rollNumber].filter(Boolean).some((value) => value!.toLowerCase().includes(needle));
    });
  }, [classId, query, students]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">Directory</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Students</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">Browse students by classroom. Each card opens that student report.</p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100"
        >
          <UserPlus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      {addOpen ? (
        <div className="mt-6 rounded-2xl border border-white/8 bg-[#11182A] p-5">
          <StudentForm
            onCreated={() => {
              setAddOpen(false);
              void load();
              router.refresh();
            }}
          />
        </div>
      ) : null}

      <div className="mt-8 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, student ID, or roll number" className="pl-10" />
        </div>
        <select value={classId} onChange={(event) => setClassId(event.target.value)} className="input-select" aria-label="Filter by class">
          <option value="all">All Classes</option>
          {classOptions.map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? <CardSkeleton /> : null}
      {!loading && failed ? (
        <div className="mt-8 rounded-3xl border border-rose-400/20 bg-rose-500/10 px-6 py-12 text-center">
          <p className="text-lg font-semibold text-white">Could not load students</p>
          <button type="button" onClick={() => { setLoading(true); void load(); }} className="mt-3 text-sm text-violet-300">Try again</button>
        </div>
      ) : null}
      {!loading && !failed && students.length === 0 ? (
        <Empty title="No students yet" body="Students created in the system will appear here." />
      ) : null}
      {!loading && !failed && students.length > 0 && visible.length === 0 ? (
        <Empty title="No students found in this class." body="Try another class or clear the search." />
      ) : null}
      {!loading && !failed && visible.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((student) => {
            const classroom = classId === "all" ? student.classes?.[0] : student.classes?.find((item) => item.id === classId) ?? student.classes?.[0];
            const section = classroom?.section || student.section;
            const classLabel = classroom ? `${classroom.name}${section && section !== "—" ? `-${section}` : ""}` : student.className;
            return (
              <Link
                key={student.id}
                href={`${basePath}/students/${student.id}`}
                className="group block overflow-hidden rounded-3xl border border-white/10 bg-[#11182A] shadow-[0_18px_50px_-36px_rgba(0,0,0,0.85)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-400/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
              >
                <StudentImageReveal src={student.photoUrl} alt={student.name} variant="card" />
                <div className="space-y-1 border-t border-white/8 p-4">
                  <h2 className="truncate text-lg font-semibold text-white">{student.name}</h2>
                  <p className="truncate text-xs text-slate-400">ID: {student.studentIdentifier}</p>
                  <p className="truncate text-sm text-slate-300">Class: {classLabel}</p>
                  <p className="truncate text-xs text-slate-500">Roll No: {student.rollNumber || "—"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-8 rounded-3xl border border-dashed border-white/12 bg-[#11182A]/70 px-8 py-16 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-white/10 bg-[#11182A]">
          <div className="h-44 animate-pulse bg-white/5" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/8" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-white/8" />
          </div>
        </div>
      ))}
    </div>
  );
}
