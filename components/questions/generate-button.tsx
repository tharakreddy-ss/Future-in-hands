"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function GenerateQuestionsButton({ classId }: { classId: string }) {
  const [pending, setPending] = useState(false);

  async function generate() {
    setPending(true);
    await fetch("/api/ai/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, count: 4 }),
    });
    setPending(false);
    window.location.reload();
  }

  return (
    <Button onClick={generate} disabled={pending}>
      {pending ? "Generating…" : "Generate with AI"}
    </Button>
  );
}
