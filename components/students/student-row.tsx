export function StudentRow({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <div>
        <p className="font-medium text-slate-900">{name}</p>
        <p className="text-sm text-slate-500">{email}</p>
      </div>
    </div>
  );
}
