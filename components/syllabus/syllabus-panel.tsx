import { Card } from "@/components/ui/card";
import { parseJson } from "@/lib/utils";
import type { Prisma } from "@prisma/client";
import type { SyllabusAnalysis } from "@/types";

export function SyllabusPanel({
  title,
  content,
  analyzedJson,
}: {
  title: string;
  content: string;
  analyzedJson: Prisma.JsonValue | string;
}) {
  const analysis = parseJson<SyllabusAnalysis>(analyzedJson, { summary: "", topics: [] });
  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{analysis.summary}</p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {analysis.topics.map((topic) => (
          <li key={topic.name} className="rounded-full bg-violet-500/15 px-3 py-1 text-sm text-violet-200">
            {topic.name} ({topic.weightage}%)
          </li>
        ))}
      </ul>
      <pre className="max-h-48 overflow-auto rounded-lg bg-[#0B1020] p-3 text-xs text-slate-400">
        {content}
      </pre>
    </Card>
  );
}
