import { formatPercent } from "@/lib/utils";

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function percentOrDash(value: number | null) {
  return value === null ? "—" : formatPercent(value);
}

export function statusClass(status: string) {
  if (status === "Excellent") return "bg-emerald-100 text-emerald-800";
  if (status === "Good") return "bg-sky-100 text-sky-800";
  if (status === "Average") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}
