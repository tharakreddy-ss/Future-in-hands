"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentForm } from "@/components/students/student-form";
import type { StudentHit } from "@/components/students/types";
import { cn } from "@/lib/utils";

export function StudentsSearch({ basePath }: { basePath: "/admin" | "/teacher" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<StudentHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [searched, setSearched] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      return;
    }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/students?q=${encodeURIComponent(query.trim())}`);
      const data = (await res.json()) as StudentHit[];
      setHits(Array.isArray(data) ? data : []);
      setSearched(true);
      setOpen(Array.isArray(data) && data.length > 0);
      setActive(0);
    }, 160);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const emptyQuery = !query.trim();
  const noHits = searched && query.trim() && hits.length === 0;

  const list = useMemo(() => hits, [hits]);

  function go(student: StudentHit) {
    router.push(`${basePath}/students/${student.id}`);
  }

  function onKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "Enter") && list.length) {
      setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(list.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && list[active]) {
      event.preventDefault();
      go(list[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">Directory</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Students</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Search and manage student academic information and performance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100"
        >
          <UserPlus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      {addOpen ? (
        <div className="mt-6 rounded-2xl border border-white/8 bg-[#11182A] p-5">
          <StudentForm />
        </div>
      ) : null}

      <div ref={boxRef} className="relative mx-auto mt-10 max-w-3xl">
        <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-slate-500" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (!e.target.value.trim()) { setHits([]); setSearched(false); setOpen(false); } }}
          onFocus={() => list.length && setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search by Student Name or Student ID..."
          className="h-14 rounded-2xl border-white/10 bg-[#11182A] pl-12 text-base shadow-[0_0_40px_rgba(124,58,237,0.12)]"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="student-suggestions"
        />
        {open && list.length > 0 ? (
          <ul
            id="student-suggestions"
            role="listbox"
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#11182A] shadow-[0_24px_80px_-32px_rgba(0,0,0,0.8)]"
          >
            {list.map((student, index) => (
              <li key={student.id} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(student)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition",
                    index === active ? "bg-violet-500/15" : "hover:bg-white/5",
                  )}
                >
                  <StudentAvatar name={student.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-white">{student.name}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">
                      Student ID: {student.studentIdentifier}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {student.className} • {student.section}
                    </span>
                  </span>
                  <Badge tone={student.status === "ACTIVE" ? "green" : "amber"}>{student.status === "ACTIVE" ? "Active" : "Inactive"}</Badge>
                  <span className="hidden items-center gap-1 text-xs text-violet-300 sm:inline-flex">
                    View Profile
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mx-auto mt-16 max-w-xl text-center">
        {emptyQuery ? (
          <div className="rounded-3xl border border-dashed border-white/12 bg-[#11182A]/70 px-8 py-16">
            <svg viewBox="0 0 160 100" className="mx-auto h-24 w-40 text-violet-400/80" aria-hidden>
              <ellipse cx="80" cy="86" rx="48" ry="8" fill="rgba(124,58,237,0.18)" />
              <rect x="38" y="28" width="84" height="52" rx="14" fill="#151D31" stroke="rgba(255,255,255,0.12)" />
              <circle cx="68" cy="52" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
              <path d="M77 61 L90 74" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M108 40 h8 M108 48 h14 M108 56 h10" stroke="rgba(79,107,255,0.7)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="mt-6 text-lg font-semibold text-white">Search for a student</p>
            <p className="mt-2 text-sm text-slate-400">
              Search for a student to view complete academic performance.
            </p>
          </div>
        ) : null}
        {noHits ? (
          <div className="rounded-3xl border border-dashed border-white/12 bg-[#11182A]/70 px-8 py-16">
            <p className="text-lg font-semibold text-white">Student not found.</p>
            <p className="mt-2 text-sm text-slate-400">
              Try searching using a different Student Name or Student ID.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
