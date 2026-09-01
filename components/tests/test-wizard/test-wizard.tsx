"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TestWizard({ classId, questionIds }: { classId: string; questionIds: string[] }) {
  const [title, setTitle] = useState("New mock test");
  const [duration, setDuration] = useState(30);
  const [pending, setPending] = useState(false);

  async function create() {
    setPending(true);
    const res = await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId,
        title,
        durationMinutes: duration,
        totalQuestions: questionIds.length,
        questionIds,
      }),
    });
    const test = await res.json();
    if (test.id) {
      await fetch(`/api/tests/${test.id}`, { method: "POST" });
      await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId: test.id, entireClass: true }),
      });
    }
    setPending(false);
    window.location.reload();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
      <h3 className="font-semibold">MAKE TEST</h3>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input
        type="number"
        min={5}
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
      />
      <p className="text-sm text-slate-500">{questionIds.length} questions selected</p>
      <Button onClick={create} disabled={pending || questionIds.length === 0}>
        {pending ? "Publishing…" : "Publish & assign class"}
      </Button>
    </div>
  );
}
