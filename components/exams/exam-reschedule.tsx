"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function toLocal(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ExamReschedule({
  examId,
  startAt,
  endAt,
  durationMinutes,
}: {
  examId: string;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  durationMinutes: number;
}) {
  const router = useRouter();
  const [start, setStart] = useState(toLocal(startAt));
  const [end, setEnd] = useState(toLocal(endAt));
  const [duration, setDuration] = useState(durationMinutes);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setPending(true);
    setError("");
    const res = await fetch(`/api/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: new Date(start).toISOString(),
        endAt: new Date(end).toISOString(),
        durationMinutes: duration,
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not reschedule");
      return;
    }
    router.refresh();
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">Edit schedule</h2>
      <label className="text-sm">Start</label>
      <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
      <label className="text-sm">End</label>
      <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
      <label className="text-sm">Duration (minutes)</label>
      <Input type="number" min={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button onClick={() => void save()} disabled={pending || !start || !end}>
        {pending ? "Saving…" : "Save schedule"}
      </Button>
    </Card>
  );
}
