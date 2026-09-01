"use client";

export function QuestionScreen({
  stem,
  options,
  selected,
  onSelect,
}: {
  stem: string;
  options: Array<{ id: string; text: string }>;
  selected: string[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">{stem}</h2>
      <ul className="mt-6 space-y-3">
        {options.map((option) => {
          const active = selected.includes(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => onSelect(option.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left ${
                  active ? "border-violet-400 bg-violet-500/15" : "border-white/10 bg-[#11182A]"
                }`}
              >
                {option.text}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
