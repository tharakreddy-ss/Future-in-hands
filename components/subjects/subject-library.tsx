"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader, Skeleton } from "@/components/layout/skeleton";

type SubjectRecord = {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
};

export function SubjectLibrary() {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/subjects", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error("Could not load subjects.");
      setSubjects(
        data.map((subject: SubjectRecord) => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          description: subject.description,
        })),
      );
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

  return (
    <div>
      <PageHeader
        eyebrow="Institute library"
        title="Subjects"
        subtitle="Create subjects here, then assign them when you set up a classroom."
        actions={
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Subject
          </Button>
        }
      />

      {open ? (
        <AddSubjectDialog
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            void load();
          }}
        />
      ) : null}

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : failed ? (
          <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            Could not load subjects.
          </p>
        ) : subjects.length === 0 ? (
          <EmptyState title="No subjects yet" description="Add your first subject to start assigning subjects to classrooms." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {subjects.map((subject) => (
              <li key={subject.id}>
                <Card>
                  <h2 className="text-lg font-semibold text-white">{subject.name}</h2>
                  {subject.code ? <p className="mt-1 text-sm text-violet-300">{subject.code}</p> : null}
                  {subject.description ? <p className="mt-3 text-sm leading-relaxed text-slate-400">{subject.description}</p> : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddSubjectDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const code = String(form.get("code") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    if (!name) {
      setError("Subject name is required.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(code ? { code } : {}),
          ...(description ? { description } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not add this subject.");
      onCreated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add this subject.");
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4" onMouseDown={() => { if (!pending) onClose(); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-subject-title"
        className="w-full max-w-lg"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Card className="hover:translate-y-0 hover:shadow-none">
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Institute library</p>
              <h2 id="add-subject-title" className="mt-1 text-xl font-semibold text-white">
                Add Subject
              </h2>
            </div>
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>
                Subject name <span className="text-rose-300">*</span>
              </span>
              <Input name="name" maxLength={100} autoFocus required />
            </label>
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>
                Subject code <span className="text-xs text-slate-600">optional</span>
              </span>
              <Input name="code" maxLength={32} />
            </label>
            <label className="block space-y-1.5 text-sm text-slate-300">
              <span>
                Description <span className="text-xs text-slate-600">optional</span>
              </span>
              <textarea
                name="description"
                maxLength={1200}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/15"
              />
            </label>
            {error ? (
              <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save subject"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
