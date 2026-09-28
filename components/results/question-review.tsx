import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type ReviewItem = {
  questionId: string;
  order: number;
  stem: string;
  topic: string | null;
  selectedText: string | null;
  correctText: string;
  status: "correct" | "incorrect" | "unanswered";
  explanation: string | null;
};

function statusBadge(status: ReviewItem["status"]) {
  if (status === "correct") return <Badge tone="green">Correct</Badge>;
  if (status === "incorrect") return <Badge tone="red">Incorrect</Badge>;
  return <Badge tone="amber">Unanswered</Badge>;
}

export function QuestionReview({ items }: { items: ReviewItem[] }) {
  if (!items.length) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-white">Question review</h2>
        <p className="mt-3 text-sm text-slate-500">No questions are available for this paper.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Question review</h2>
      {items.map((item) => (
        <Card key={item.questionId} className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
              Question {item.order}
              {item.topic ? ` · ${item.topic}` : ""}
            </p>
            {statusBadge(item.status)}
          </div>
          <p className="text-base font-medium text-white">{item.stem}</p>
          <div className="space-y-1 text-sm">
            <p className="text-slate-400">
              Your answer:{" "}
              <span className="text-slate-200">{item.selectedText ?? "Not answered"}</span>
            </p>
            <p className="text-slate-400">
              Correct answer: <span className="text-slate-200">{item.correctText}</span>
            </p>
          </div>
          {item.explanation ? (
            <p className="text-sm leading-relaxed text-slate-300">{item.explanation}</p>
          ) : (
            <p className="text-sm text-slate-500">No explanation is stored for this question.</p>
          )}
        </Card>
      ))}
    </div>
  );
}
