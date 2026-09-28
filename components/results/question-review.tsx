import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  questionId: string;
  order: number;
  stem: string;
  topic: string | null;
  subtopic: string | null;
  options: Array<{ key: string; text: string }>;
  selectedKey: string | null;
  selectedText: string | null;
  correctKey: string;
  correctText: string;
  status: "correct" | "incorrect" | "unanswered";
  explanation: string | null;
};

function statusBadge(status: ReviewItem["status"]) {
  if (status === "correct") return <Badge tone="green">Correct</Badge>;
  if (status === "incorrect") return <Badge tone="red">Wrong</Badge>;
  return <Badge tone="slate">Unanswered</Badge>;
}

function optionClass(item: ReviewItem, key: string) {
  const isCorrect = key === item.correctKey;
  const isSelected = key === item.selectedKey;
  if (isCorrect) return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
  if (isSelected) return "border-red-400/40 bg-red-500/10 text-red-100";
  return "border-white/8 bg-white/5 text-slate-300";
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
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Question review</h2>
        <p className="mt-1 text-sm text-slate-400">Shown in the same order as your exam paper.</p>
      </div>
      {items.map((item) => (
        <Card key={item.questionId} className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
              Question {item.order}
              {item.topic ? ` · ${item.topic}` : ""}
              {item.subtopic ? ` · ${item.subtopic}` : ""}
            </p>
            {statusBadge(item.status)}
          </div>
          <p className="text-base font-medium text-white">{item.stem}</p>
          <ul className="space-y-2">
            {item.options.map((option) => (
              <li
                key={option.key}
                className={cn("rounded-xl border px-3 py-2 text-sm", optionClass(item, option.key))}
              >
                <span className="font-medium">{option.key}.</span> {option.text}
                {option.key === item.selectedKey ? (
                  <span className="ml-2 text-xs uppercase tracking-wide opacity-80">Your answer</span>
                ) : null}
                {option.key === item.correctKey ? (
                  <span className="ml-2 text-xs uppercase tracking-wide opacity-80">Correct</span>
                ) : null}
              </li>
            ))}
          </ul>
          {item.status === "unanswered" ? (
            <p className="text-sm text-slate-400">
              Your answer: <span className="text-slate-200">Not answered</span>
            </p>
          ) : null}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Explanation</p>
            {item.explanation ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{item.explanation}</p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">No explanation available for this question.</p>
            )}
          </div>
        </Card>
      ))}
    </section>
  );
}
