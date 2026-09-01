import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function TestCard({
  title,
  status,
  durationMinutes,
  questionCount,
}: {
  title: string;
  status: string;
  durationMinutes: number;
  questionCount: number;
}) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {durationMinutes} min · {questionCount} questions
        </p>
      </div>
      <Badge tone={status === "PUBLISHED" ? "green" : "amber"}>{status}</Badge>
    </Card>
  );
}
