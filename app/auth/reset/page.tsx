"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const strength = useMemo(() => {
    if (password.length > 10 && /[A-Z]/.test(password) && /\d/.test(password)) return "Strong";
    if (password.length > 6) return "Medium";
    return "Weak";
  }, [password]);

  return (
    <div className="grid min-h-screen place-items-center bg-[#080D1C] p-6">
      <form
        className="w-full max-w-md space-y-4 rounded-3xl border border-white/8 bg-[#11182A] p-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (password === confirm) router.push("/auth/login");
        }}
      >
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <label className="block text-sm text-slate-400">
          New Password
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
        </label>
        <p className="text-xs text-slate-500">Strength: {strength}</p>
        <label className="block text-sm text-slate-400">
          Confirm Password
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="mt-1" />
        </label>
        <Button type="submit" className="w-full" disabled={password !== confirm || password.length < 8}>
          Reset Password
        </Button>
      </form>
    </div>
  );
}
