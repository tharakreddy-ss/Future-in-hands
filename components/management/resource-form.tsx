"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
type Field = { name: string; label: string; type?: string; value?: string; optional?: boolean; options?: Array<{ value: string; label: string }> };
export function ResourceForm({ title, endpoint, fields, method = "POST", successPath }: { title: string; endpoint: string; fields: Field[]; method?: "POST" | "PATCH"; successPath?: string }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries([...new FormData(form)].filter(([, value]) => value !== ""));
    try {
      const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Could not save");
      setMessage(data.studentIdentifier ? `Student created. Login ID: ${data.studentIdentifier}` : "Saved successfully");
      if (method === "POST") form.reset();
      if (successPath) router.push(successPath.replace(":id", data.id));
      router.refresh();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Connection lost. Please retry."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="my-6 max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-[#11182A] p-6 shadow-xl shadow-black/10">
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <label key={field.name} className="space-y-2 text-sm text-slate-300"><span>{field.label}</span>{field.options ? <select name={field.name} defaultValue={field.value} required={!field.optional} className="w-full rounded-xl border border-white/10 bg-[#0B1020] p-3">{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <Input name={field.name} type={field.type || "text"} defaultValue={field.value} required={!field.optional} minLength={field.type === "password" ? 8 : undefined} />}</label>)}</div>
    {message ? <p role="status" className="text-sm text-violet-200">{message}</p> : null}<Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
  </form>;
}
export function InstitutionStatusButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  return <div><Button disabled={pending} variant="secondary" onClick={async () => { setPending(true); try { const res = await fetch(`/api/institutions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: active ? "INACTIVE" : "ACTIVE" }) }); if (!res.ok) throw new Error("Could not update institution"); router.refresh(); } catch (e) { setError(e instanceof Error ? e.message : "Request failed"); } finally { setPending(false); } }}>{active ? "Deactivate" : "Activate"}</Button>{error ? <p role="alert">{error}</p> : null}</div>;
}
