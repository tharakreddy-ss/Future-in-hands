import { analyticsService } from "@/services/analytics.service";
import { ScoreBars } from "@/components/analytics/score-bars";
import { Card } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";

export default async function ClassPerformancePage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const data = await analyticsService.classPerformance(classId);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 font-semibold">Average by student</h2>
        {data.students.length === 0 ? (
          <p className="text-sm text-slate-500">No submitted attempts yet.</p>
        ) : (
          <ScoreBars items={data.students.map((row) => ({ label: row.name, value: row.averageScore }))} />
        )}
      </Card>
      <Card>
        <h2 className="mb-4 font-semibold">Recent attempts</h2>
        <ul className="divide-y">
          {data.results.map((row) => (
            <li key={row.id} className="flex justify-between py-3 text-sm">
              <span>
                {row.student.firstName} {row.student.lastName} · {row.test.title}
              </span>
              <span className="font-medium">
                {row.score}/{row.totalQuestions} ({formatPercent(row.percentage)})
              </span>
            </li>
          ))}
          {data.results.length === 0 ? (
            <li className="py-3 text-sm text-slate-500">No submitted attempts yet.</li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}
