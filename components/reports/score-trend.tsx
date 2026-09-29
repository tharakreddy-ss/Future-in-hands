import { formatDateTime } from "@/components/reports/format";
import { formatDate } from "@/lib/utils";

type Point = { examName: string; date: string; percentage: number };

const WIDTH = 720;
const HEIGHT = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };

export function ScoreTrend({ series, caption }: { series: Point[]; caption?: string }) {
  if (series.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No submitted exams to chart yet.</p>;
  }
  const firstLabel = formatDate(series[0].date);
  const lastLabel = formatDate(series[series.length - 1].date);
  const sameDay = firstLabel === lastLabel;

  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) =>
    PAD.left + (series.length === 1 ? innerW / 2 : (index / (series.length - 1)) * innerW);
  const y = (value: number) => PAD.top + innerH - (Math.max(0, Math.min(100, value)) / 100) * innerH;
  const points = series.map((row, index) => `${x(index)},${y(row.percentage)}`).join(" ");

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Score trend across ${series.length} submitted exams`}
      >
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="#e2e8f0"
              strokeDasharray={tick === 0 ? undefined : "3 4"}
            />
            <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="#64748b">
              {tick}%
            </text>
          </g>
        ))}
        {series.length > 1 ? (
          <polyline points={points} fill="none" stroke="#6d28d9" strokeWidth="2.5" strokeLinejoin="round" />
        ) : null}
        {series.map((row, index) => (
          <circle key={`${row.date}-${index}`} cx={x(index)} cy={y(row.percentage)} r="4" fill="#6d28d9">
            <title>{`${row.examName}: ${Math.round(row.percentage)}% (${formatDateTime(row.date)})`}</title>
          </circle>
        ))}
        {sameDay ? (
          <text x={PAD.left + innerW / 2} y={HEIGHT - 8} textAnchor="middle" fontSize="11" fill="#64748b">
            {series.length > 1 ? `All on ${firstLabel}` : firstLabel}
          </text>
        ) : (
          <>
            <text x={PAD.left} y={HEIGHT - 8} fontSize="11" fill="#64748b">
              {firstLabel}
            </text>
            <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end" fontSize="11" fill="#64748b">
              {lastLabel}
            </text>
          </>
        )}
      </svg>
      <figcaption className="mt-1 text-xs text-slate-500">
        {caption ?? "Percentage score per submitted exam, oldest to newest"} ({series.length}{" "}
        {series.length === 1 ? "exam" : "exams"}).
      </figcaption>
    </figure>
  );
}
