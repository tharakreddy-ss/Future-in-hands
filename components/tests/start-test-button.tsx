"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function StartTestButton({
  assignmentId,
  attemptId,
  status,
  window,
  labels,
}: {
  assignmentId: string;
  attemptId?: string;
  status?: string;
  window?: "LOCKED" | "LIVE" | "CLOSED";
  labels?: { start?: string; resume?: string };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (status === "SUBMITTED") {
    return (
      <Button variant="secondary" onClick={() => router.push(`/student/results/${attemptId}`)}>
        View result
      </Button>
    );
  }

  if (window === "LOCKED") {
    return (
      <Button variant="secondary" disabled>
        Exam locked
      </Button>
    );
  }

  if (window === "CLOSED") {
    return (
      <Button variant="secondary" disabled>
        Exam closed
      </Button>
    );
  }

  async function start() {
    setPending(true);
    setError("");
    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId }),
    });
    const attempt = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(attempt.error ?? "Cannot start exam");
      return;
    }
    if (attempt?.status && attempt.status !== "IN_PROGRESS") {
      router.push(`/student/results/${attempt.id}`);
      return;
    }
    if (attempt.id) router.push(`/student/attempt/${attempt.id}`);
  }

  return (
    <div className="text-right">
      <Button onClick={start} disabled={pending}>
        {pending ? "Starting…" : attemptId ? labels?.resume ?? "Continue exam" : labels?.start ?? "Start exam"}
      </Button>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
