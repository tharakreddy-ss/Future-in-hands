"use client";

import { useEffect, useState } from "react";

export function ExamCountdown({ startAt }: { startAt: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function tick() {
      const ms = Math.max(0, new Date(startAt).getTime() - Date.now());
      const total = Math.floor(ms / 1000);
      const d = Math.floor(total / 86400);
      const h = Math.floor((total % 86400) / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      setLabel(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startAt]);

  return <span>{label || "…"}</span>;
}
