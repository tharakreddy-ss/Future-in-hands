import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/utils";
import type { PublicPracticeSession } from "@/services/practice.service";

export function PracticeSummary({ session }: { session: PublicPracticeSession }) {
  const total = session.questions.length;
  const correct = Object.values(session.results).filter((row) => row.correct).length;
  const wrong = total - correct;
  const accuracy = total ? (correct / total) * 100 : 0;
  const sourceLabel = session.source === "AI" ? "AI Quiz" : "Question Bank";

  return (
    <Card className="hover:translate-y-0">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300/80">Practice Complete</p>
      <h2 className="mt-2 text-2xl font-semibold text-white">Practice Complete</h2>
      <p className="mt-2 text-sm text-slate-400">
        This was a learning quiz. It is not an official exam result and was not saved to Results.
      </p>
      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <Stat label="Questions" value={String(total)} />
        <Stat label="Correct" value={String(correct)} />
        <Stat label="Wrong" value={String(wrong)} />
        <Stat label="Accuracy" value={formatPercent(accuracy)} />
        <Stat label="Source" value={sourceLabel} />
        <Stat label="Subject" value={session.subject ?? "—"} />
        {session.topic ? <Stat label="Topic" value={session.topic} /> : null}
        {session.difficulty ? <Stat label="Difficulty" value={session.difficulty} /> : null}
        <Stat label="Class" value={session.className} />
      </dl>
      <Link href="/student/practice" className="mt-6 inline-block w-full sm:w-auto">
        <Button type="button" className="w-full sm:w-auto">
          Start New Practice
        </Button>
      </Link>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1020]/60 px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-white">{value}</dd>
    </div>
  );
}
