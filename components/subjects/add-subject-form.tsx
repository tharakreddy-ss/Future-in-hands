"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function FileField({ title, hint, name, file, onChange }: {
  title: string;
  hint: string;
  name: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-dashed border-white/15 bg-[#0B1020] p-4 transition hover:border-violet-400/40 hover:bg-violet-500/[0.04]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
        {name === "syllabus" ? <BookOpen className="h-5 w-5" aria-hidden /> : <FileText className="h-5 w-5" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">{title} <span className="text-rose-300">*</span></span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-500">{file ? file.name : hint}</span>
      </span>
      <Upload className="mt-1 h-4 w-4 shrink-0 text-slate-500 group-hover:text-violet-300" aria-hidden />
      <input className="sr-only" type="file" accept="application/pdf,.pdf" required onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
    </label>
  );
}

export function AddSubjectForm() {
  const router = useRouter();
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [material, setMaterial] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    if (syllabus) form.set("syllabus", syllabus);
    if (material) form.set("material", material);
    try {
      const response = await fetch("/api/subjects", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not add this subject.");
      router.push(`/admin/subjects/${data.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not add this subject.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="mx-auto max-w-3xl space-y-5">
      <Card className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Institute library</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Subject details</h2>
          <p className="mt-1 text-sm text-slate-500">This subject and its source material will be available to the classes you assign it to.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm text-slate-300">Subject name <span className="text-rose-300">*</span><Input name="name" placeholder="e.g. Mathematics" minLength={2} maxLength={100} required /></label>
          <label className="space-y-1.5 text-sm text-slate-300">Subject code <span className="text-xs text-slate-600">optional</span><Input name="code" placeholder="e.g. MATH-10" maxLength={32} /></label>
          <label className="space-y-1.5 text-sm text-slate-300">Grade / level <Input name="gradeLevel" placeholder="e.g. Grade 10" maxLength={64} /></label>
          <label className="space-y-1.5 text-sm text-slate-300">Board / curriculum <Input name="curriculum" placeholder="e.g. CBSE, State Board" maxLength={100} /></label>
          <label className="space-y-1.5 text-sm text-slate-300 sm:col-span-2">Academic year <Input name="academicYear" placeholder="e.g. 2026–27" maxLength={32} /></label>
          <label className="space-y-1.5 text-sm text-slate-300 sm:col-span-2">Description <textarea name="description" maxLength={1200} rows={3} placeholder="What this subject covers, or how the institute teaches it…" className="w-full rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/15" /></label>
        </div>
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Add source documents</h2>
          <p className="mt-1 text-sm text-slate-500">Both PDFs are stored privately. Text is extracted page by page so exam questions can follow the institute’s material.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <FileField name="syllabus" title="Official syllabus PDF" hint="Units, chapters and prescribed topics · PDF up to 20 MB" file={syllabus} onChange={setSyllabus} />
          <FileField name="material" title="Institute study material PDF" hint="Notes, textbook or institute-specific material · PDF up to 20 MB" file={material} onChange={setMaterial} />
        </div>
      </Card>
      {error ? <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p> : null}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={pending}>Cancel</Button>
        <Button type="submit" disabled={pending || !syllabus || !material}>{pending ? "Reading documents…" : "Add Subject to Library"}</Button>
      </div>
    </form>
  );
}
