"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ExamMonitorRefresh() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(id);
  }, [router]);
  return <p className="text-xs text-slate-400">Auto-refreshing live counts…</p>;
}
