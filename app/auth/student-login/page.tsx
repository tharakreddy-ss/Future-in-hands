import { LoginPortal } from "@/components/auth/login-form";

export default function StudentLoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#080D1C] p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/8 bg-[#11182A] p-8">
        <h1 className="text-2xl font-semibold">Student sign in</h1>
        <p className="mb-6 mt-2 text-sm text-slate-400">Use your Student ID and password.</p>
        <LoginPortal defaultTab="student" />
      </div>
    </div>
  );
}
