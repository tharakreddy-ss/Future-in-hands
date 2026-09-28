"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

type SubjectOption = { id: string; name: string; code: string | null };

export function ClassOnboardingForm({ defaultYear }: { defaultYear?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectsState, setSubjectsState] = useState<"loading" | "ready" | "error">("loading");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadSubjects = useCallback(async () => {
    try {
      const response = await fetch("/api/subjects", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load subjects.");
      setSubjects(Array.isArray(data) ? data : []);
      setSubjectsState("ready");
    } catch {
      setSubjectsState("error");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSubjects();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSubjects]);

  function toggleSubject(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedIds.length === 0) {
      setError("Please select at least one subject.");
      return;
    }
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get("name") ?? ""),
      academicYear: String(form.get("academicYear") ?? ""),
      groupName: String(form.get("groupName") ?? ""),
      section: String(form.get("section") ?? ""),
      description: String(form.get("description") ?? ""),
      subjectIds: selectedIds,
    };
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create the classroom.");
      router.push("/admin/classes");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create the classroom.");
      setPending(false);
    }
  }

  const selected = subjects.filter((subject) => selectedIds.includes(subject.id));

  return (
    <form onSubmit={(event) => void submit(event)} className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Academic setup</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Create a classroom</h1>
        <p className="mt-2 text-sm text-slate-400">
          Name the classroom, place it in a year and group, and attach the subjects it teaches.
        </p>
      </div>
      <Card className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Academic year">
            <select
              name="academicYear"
              defaultValue={YEARS.includes(defaultYear ?? "") ? defaultYear : "1st Year"}
              className="input-select"
            >
              {YEARS.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </Field>
          <Field label="Group / branch">
            <Input name="groupName" placeholder="e.g. CSE, MPC, BiPC" required maxLength={80} />
          </Field>
          <Field label="Section" optional>
            <Input name="section" placeholder="e.g. A, B, Morning batch" maxLength={40} />
          </Field>
          <Field label="Classroom name">
            <Input name="name" placeholder="e.g. Class 10 · Section A" required minLength={2} />
          </Field>
          <div className="sm:col-span-2">
            <SubjectPicker
              subjects={subjects}
              state={subjectsState}
              selected={selected}
              selectedIds={selectedIds}
              onToggle={toggleSubject}
              onRemove={(id) => toggleSubject(id)}
              onOpen={() => void loadSubjects()}
            />
          </div>
          <Field label="Notes for staff" optional>
            <textarea
              name="description"
              rows={4}
              maxLength={1000}
              placeholder="Learning goals, faculty note or batch details…"
              className="input-select sm:col-span-2"
            />
          </Field>
        </div>
      </Card>
      {error ? (
        <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || subjectsState !== "ready" || subjects.length === 0}>
          {pending ? "Creating…" : <>Create classroom <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </form>
  );
}

function SubjectPicker({
  subjects,
  state,
  selected,
  selectedIds,
  onToggle,
  onRemove,
  onOpen,
}: {
  subjects: SubjectOption[];
  state: "loading" | "ready" | "error";
  selected: SubjectOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="space-y-2">
      <span className="block text-sm text-slate-300">
        Add subjects <span className="text-rose-300">*</span>
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={state !== "ready" || subjects.length === 0}
        onClick={() =>
          setOpen((value) => {
            if (!value) onOpen();
            return !value;
          })
        }
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2.5 text-left text-sm text-slate-200 outline-none focus:border-violet-400/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="text-slate-400">
          {state === "loading" ? "Loading subjects…" : selected.length ? `${selected.length} selected` : "Choose subjects"}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </button>
      {open && state === "ready" ? (
        <ul id={listId} role="listbox" aria-multiselectable="true" className="max-h-56 overflow-auto rounded-xl border border-white/10 bg-[#0B1020] p-1.5 shadow-2xl">
          {subjects.map((subject) => {
            const checked = selectedIds.includes(subject.id);
            return (
              <li key={subject.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-white/[0.06]">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(subject.id)}
                    className="h-4 w-4 accent-violet-500"
                  />
                  <span className="text-white">{subject.name}</span>
                  {subject.code ? <span className="text-xs text-slate-500">{subject.code}</span> : null}
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => onRemove(subject.id)}
              className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-100"
            >
              {subject.name}
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {subject.name}</span>
            </button>
          ))}
        </div>
      ) : null}
      {state === "error" ? <p className="text-sm text-rose-200">Could not load subjects. Refresh and try again.</p> : null}
      {state === "ready" && subjects.length === 0 ? (
        <p className="text-sm text-slate-400">
          No subjects available.{" "}
          <Link href="/admin/subjects" className="text-violet-300 hover:text-white">
            Create subjects
          </Link>{" "}
          before assigning them to a classroom.
        </p>
      ) : null}
    </div>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm text-slate-300">
      <span>
        {label} {optional ? <span className="text-xs text-slate-600">optional</span> : <span className="text-rose-300">*</span>}
      </span>
      {children}
    </label>
  );
}
