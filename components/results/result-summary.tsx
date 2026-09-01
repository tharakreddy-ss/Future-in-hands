import { Card } from "@/components/ui/card";
import { formatPercent } from "@/lib/utils";
import type { TopicScore } from "@/types";

export function ResultSummary({
  score,
  maxScore,
  percentage,
  topics,
}: {
  score: number;
  maxScore: number;
  percentage: number;
  topics: TopicScore[];
}) {
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-slate-500">Score</p>
        <p className="mt-2 text-4xl font-semibold">
          {score}/{maxScore}{" "}
          <span className="text-xl text-violet-300">{formatPercent(percentage)}</span>
        </p>
      </Card>
      <Card>
        <h3 className="font-semibold">Topic coverage</h3>
        <ul className="mt-3 space-y-2">
          {topics.map((topic) => (
            <li key={topic.topic} className="flex justify-between text-sm">
              <span>{topic.topic}</span>
              <span>
                {topic.correct}/{topic.total}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
