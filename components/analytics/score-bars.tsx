export function ScoreBars({
  items,
}: {
  items: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{item.label}</span>
            <span>{Math.round(item.value)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF]"
              style={{ width: `${Math.min(100, item.value)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
