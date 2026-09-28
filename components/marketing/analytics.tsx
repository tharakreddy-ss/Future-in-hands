import { FadeUp, GlassCard, SectionHeading } from "@/components/marketing/ui";

const INSIGHTS = [
  "Class and student totals",
  "Average, highest, and lowest scores",
  "Exam completion",
  "Topic gaps after results are released",
  "Performance over time",
];

export function AnalyticsSection() {
  return (
    <section id="analytics" className="px-4 py-20 md:px-6">
      <div className="mx-auto max-w-7xl">
        <FadeUp>
          <SectionHeading
            title="Turn Exam Data into Actionable Insights"
            subtitle="Scores, completion, and topic gaps are calculated from exams your institution actually runs."
          />
        </FadeUp>
        <FadeUp className="mt-12">
          <div className="marketing-glass rounded-[28px] p-5 md:p-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {INSIGHTS.map((label) => (
                <GlassCard key={label} hover={false} className="p-4">
                  <p className="text-sm text-slate-300">{label}</p>
                  <p className="mt-2 text-xs text-slate-500">Filled from submitted results</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
