"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="grid min-h-screen place-items-center bg-[#080D1C] p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/8 bg-[#11182A] p-8">
        {sent ? (
          <>
            <h1 className="text-2xl font-semibold">Check your email</h1>
            <p className="mt-3 text-sm text-slate-400">If an account exists, a reset link is on its way.</p>
            <Link href="/auth/login" className="mt-6 inline-block text-sm text-violet-300">
              Back to login
            </Link>
          </>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <h1 className="text-2xl font-semibold">Forgot password</h1>
            <label className="block text-sm text-slate-400">
              Email Address
              <Input type="email" required className="mt-1" />
            </label>
            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
