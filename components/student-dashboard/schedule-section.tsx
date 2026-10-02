import { Check } from "lucide-react";
import { Panel } from "@/components/student-dashboard/section";
import { cn } from "@/lib/utils";
import type { ScheduleDay } from "@/services/student-dashboard.service";

export function ScheduleSection({ days, activeDays }: { days: ScheduleDay[]; activeDays: number }) {
  const examDays = days.filter((day) => !day.isPast && day.exams.length > 0).length;
  return (
    <Panel className="p-4 md:p-5">
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-2 lg:grid-cols-14" aria-label="Last 7 days and next 7 days">
        {days.map((day) => {
          const hasExam = day.exams.length > 0;
          const description = [
            day.isToday ? "Today" : null,
            day.active ? "learning activity completed" : null,
            hasExam ? `exam: ${day.exams.map((exam) => exam.title).join(", ")}` : null,
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <li
              key={day.key}
              title={hasExam ? day.exams.map((exam) => exam.title).join("\n") : undefined}
              aria-label={`${day.weekday} ${day.day}${description ? `: ${description}` : ""}`}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center",
                day.isToday ? "border-violet-400/50 bg-violet-500/[0.12]" : "border-white/[0.05] bg-white/[0.02]",
              )}
            >
              <span className={cn("text-[10px] font-semibold uppercase tracking-wide", day.isToday ? "text-violet-200" : "text-slate-500")}>
                {day.weekday}
              </span>
              <span className={cn("text-sm font-semibold tabular-nums", day.isPast && !day.isToday ? "text-slate-400" : "text-white")}>{day.day}</span>
              <span className="flex h-4 items-center gap-1" aria-hidden>
                {day.active ? (
                  <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                ) : null}
                {hasExam ? <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
              <Check className="h-2 w-2" strokeWidth={3} aria-hidden />
            </span>
            Practice or exam completed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" aria-hidden />
            Exam scheduled
          </span>
        </div>
        <p>
          {activeDays} active {activeDays === 1 ? "day" : "days"} this week · {examDays} upcoming exam {examDays === 1 ? "day" : "days"}
        </p>
      </div>
    </Panel>
  );
}
