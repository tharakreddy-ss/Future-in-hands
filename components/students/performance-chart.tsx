"use client";

import { useMemo, useState } from "react";
import { formatDate, formatPercent } from "@/lib/utils";
import type { StudentProfile } from "@/components/students/types";

type Range = "5" | "10" | "30d" | "3m" | "all";

export function PerformanceChart({ series }: { series: StudentProfile["series"] }) {
  const [range, setRange] = useState<Range>("all");
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo(() => {
    const now = Date.now();
    let rows = series;
    if (range === "5") rows = series.slice(-5);
    if (range === "10") rows = series.slice(-10);
    if (range === "30d") rows = series.filter((row) => now - new Date(row.date).getTime() <= 30 * 86400000);
    if (range === "3m") rows = series.filter((row) => now - new Date(row.date).getTime() <= 90 * 86400000);
    return rows;
  }, [range, series]);

  const w = 640;
  const h = 240;
  const pad = 36;
  const xs = points.map((_, i) => pad + (i * (w - pad * 2)) / Math.max(points.length - 1, 1));
  const ys = points.map((p) => pad + (1 - p.percentage / 100) * (h - pad * 2));
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${ys[i]}`)
    .join(" ");
  const area = points.length
    ? `${d} L ${xs[points.length - 1]} ${h - pad} L ${xs[0]} ${h - pad} Z`
    : "";

  const tip = hover != null ? points[hover] : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["5", "Last 5 Tests"],
            ["10", "Last 10 Tests"],
            ["30d", "Last 30 Days"],
            ["3m", "Last 3 Months"],
            ["all", "All Time"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            className={
              range === key
                ? "rounded-full bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-3 py-1 text-xs font-semibold text-white"
                : "rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300"
            }
          >
            {label}
          </button>
        ))}
      </div>
      {points.length === 0 ? (
        <p className="mt-10 text-sm text-slate-400">No submitted tests in this range.</p>
      ) : (
        <div className="relative mt-4">
          <svg viewBox={`0 0 ${w} ${h}`} className="h-64 w-full">
            {[0, 25, 50, 75, 100].map((tick) => {
              const y = pad + (1 - tick / 100) * (h - pad * 2);
              return (
                <g key={tick}>
                  <line x1={pad} x2={w - pad} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" />
                  <text x={8} y={y + 4} fill="#94a3b8" fontSize="10">
                    {tick}
                  </text>
                </g>
              );
            })}
            <path d={area} fill="url(#perfFill)" />
            <path d={d} fill="none" stroke="#7C3AED" strokeWidth="2.5" />
            <defs>
              <linearGradient id="perfFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(124,58,237,0.35)" />
                <stop offset="100%" stopColor="rgba(124,58,237,0)" />
              </linearGradient>
            </defs>
            {points.map((p, i) => (
              <circle
                key={`${p.examName}-${i}`}
                cx={xs[i]}
                cy={ys[i]}
                r={hover === i ? 6 : 4}
                fill="#4F6BFF"
                stroke="#fff"
                strokeWidth="1"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />
            ))}
          </svg>
          {tip ? (
            <div className="pointer-events-none absolute right-4 top-2 rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2 text-xs text-slate-200 shadow-xl">
              <p className="font-semibold text-white">{tip.examName}</p>
              <p className="text-slate-400">{tip.subject}</p>
              <p>{formatDate(tip.date)}</p>
              <p>
                {tip.score} / {tip.total} · {formatPercent(tip.percentage)}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
