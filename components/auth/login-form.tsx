"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DemoCredentials } from "@/components/auth/demo-credentials";
import { cn } from "@/lib/utils";
import { PremiumAction } from "@/components/effects/library-effects";

export function LoginPortal({ defaultTab = "staff" }: { defaultTab?: "staff" | "student" }) {
  const router = useRouter();
  const [tab, setTab] = useState<"staff" | "student">(defaultTab);
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        tab === "student"
          ? { mode: "student", studentId, password }
          : { mode: "staff", email, password },
      ),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    router.push(data.redirectTo);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/5 p-1">
        <button
          type="button"
          className={cn("rounded-lg py-2 text-sm font-medium", tab === "staff" && "bg-[#151D31] text-white shadow")}
          onClick={() => setTab("staff")}
        >
          Admin Login
        </button>
        <button
          type="button"
          className={cn("rounded-lg py-2 text-sm font-medium", tab === "student" && "bg-[#151D31] text-white shadow")}
          onClick={() => setTab("student")}
        >
          Student Login
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        {tab === "staff" ? (
          <div>
            <label className="mb-1 block text-sm text-slate-400">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm text-slate-400">Student ID</label>
            <Input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value.toUpperCase())}
              placeholder="STU001"
              required
            />
          </div>
        )}
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <label className="text-slate-400">Password</label>
            <Link href="/auth/forgot" className="text-violet-300 hover:underline">
              Forgot Password?
            </Link>
          </div>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember Me
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <PremiumAction active={!pending} strength={0.78}>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign In"}
          </Button>
        </PremiumAction>
      </form>
      <p className="mt-4 text-center text-xs text-slate-500">OR</p>
      <Button variant="outline" type="button" className="mt-3 w-full" disabled>
        Continue with Google
      </Button>
      <DemoCredentials
        onStaff={(emailValue, passwordValue) => {
          setTab("staff");
          setEmail(emailValue);
          setPassword(passwordValue);
        }}
        onStudent={(id, passwordValue) => {
          setTab("student");
          setStudentId(id);
          setPassword(passwordValue);
        }}
      />
      <p className="mt-6 text-center text-sm text-slate-500">
        Need help? <Link href="/about" className="text-violet-300">Contact Support</Link>
      </p>
    </div>
  );
}
