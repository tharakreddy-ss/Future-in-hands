import { Badge } from "@/components/ui/badge";

export function QuestionCard({
  stem,
  difficulty,
  source,
}: {
  stem: string;
  difficulty: string;
  source: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="font-medium text-slate-900">{stem}</p>
      <div className="mt-2 flex gap-2">
        <Badge tone="teal">{difficulty}</Badge>
        <Badge>{source}</Badge>
      </div>
    </div>
  );
}
