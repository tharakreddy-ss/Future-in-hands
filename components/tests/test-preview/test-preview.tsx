export function TestPreview({
  title,
  questions,
}: {
  title: string;
  questions: Array<{ stem: string }>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{title}</h3>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
        {questions.map((q, i) => (
          <li key={i}>{q.stem}</li>
        ))}
      </ol>
    </div>
  );
}
