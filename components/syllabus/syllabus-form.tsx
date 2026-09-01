"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SyllabusForm({ classId }: { classId: string }) {
  const [title, setTitle] = useState("Indian Polity syllabus");
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    await fetch("/api/syllabuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, title, content, inputType: "TEXT" }),
    });
    setPending(false);
    window.location.reload();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border bg-white p-4">
      <h3 className="font-semibold">Analyze syllabus</h3>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        className="h-32 w-full rounded-lg border border-slate-200 p-3 text-sm"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Paste topic list or full syllabus text"
        required
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Analyzing…" : "Save & analyze"}
      </Button>
    </form>
  );
}
