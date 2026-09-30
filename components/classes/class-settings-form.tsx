"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, SubjectPicker, YEARS, type SubjectOption } from "@/components/classes/class-onboarding-form";

type ClassSettings = {
  id: string;
  name: string;
  description: string | null;
  academicYear: string;
  groupName: string;
  section: string | null;
  subject: string;
  subjectIds: string[];
};

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

export function ClassSettingsForm({ initial }: { initial: ClassSettings }) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [subjectsState, setSubjectsState] = useState<"loading" | "ready" | "error">("loading");
  const [savedIds, setSavedIds] = useState(initial.subjectIds);
  const [selectedIds, setSelectedIds] = useState(initial.subjectIds);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    const timer = window.setTimeout(() => void loadSubjects(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSubjects]);

  function toggleSubject(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    setError("");
    setSuccess("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subjectsChanged = !sameIds(selectedIds, savedIds);
    if (subjectsChanged && selectedIds.length === 0) {
      setError("Please select at least one subject.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const body = {
      name: String(form.get("name") ?? ""),
      academicYear: String(form.get("academicYear") ?? ""),
      groupName: String(form.get("groupName") ?? ""),
      section: String(form.get("section") ?? ""),
      description: String(form.get("description") ?? ""),
      ...(subjectsChanged ? { subjectIds: selectedIds } : {}),
    };
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/classes/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? "Could not save the classroom settings.");
      setSavedIds(selectedIds);
      setSuccess("Classroom settings saved.");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the classroom settings.");
    } finally {
      setPending(false);
    }
  }

  const selected = subjects.filter((subject) => selectedIds.includes(subject.id));

  return (
    <form onSubmit={(event) => void submit(event)} className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Classroom settings</h2>
        <p className="mt-1 text-sm text-slate-400">Update the classroom details and the subjects it teaches.</p>
      </div>
      <Card className="space-y-5 hover:translate-y-0">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Classroom name">
            <Input name="name" defaultValue={initial.name} required minLength={2} maxLength={120} />
          </Field>
          <Field label="Academic year">
            <select name="academicYear" defaultValue={initial.academicYear} className="input-select">
              {YEARS.map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </Field>
          <Field label="Group / branch">
            <Input name="groupName" defaultValue={initial.groupName} required maxLength={80} />
          </Field>
          <Field label="Section" optional>
            <Input name="section" defaultValue={initial.section ?? ""} maxLength={40} />
          </Field>
          <div className="sm:col-span-2">
            {savedIds.length === 0 && initial.subject ? (
              <p className="mb-2 text-sm text-slate-400">
                Current subject label: <span className="text-white">{initial.subject}</span>. It is not linked to the
                subject library yet; choose subjects below to link them.
              </p>
            ) : null}
            <SubjectPicker
              subjects={subjects}
              state={subjectsState}
              selected={selected}
              selectedIds={selectedIds}
              onToggle={toggleSubject}
              onRemove={toggleSubject}
              onOpen={() => void loadSubjects()}
            />
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes for staff" optional>
              <textarea
                name="description"
                rows={4}
                maxLength={1000}
                defaultValue={initial.description ?? ""}
                className="input-select"
              />
            </Field>
          </div>
        </div>
      </Card>
      {error ? (
        <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
