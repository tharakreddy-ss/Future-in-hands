"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewClassPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, description }),
    });
    const cls = await res.json();
    if (cls.id) router.push(`/admin/classes/${cls.id}/overview`);
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">New class</h1>
      <Input placeholder="Class name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
      <Input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button type="submit">Create</Button>
    </form>
  );
}
