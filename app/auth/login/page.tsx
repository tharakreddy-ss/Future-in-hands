import { LoginPortal } from "@/components/auth/login-form";
import { BrandLockup } from "@/components/shell/app-shell";

export default function StaffLoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#0B1020] p-12 lg:flex lg:flex-col">
        <BrandLockup />
        <div className="relative z-10 mt-16 max-w-lg">
          <h1 className="text-4xl font-semibold leading-tight text-white">
            AI-Powered Exams,
            <br />
            <span className="gradient-text">Better Outcomes</span>
          </h1>
          <p className="mt-4 text-slate-400">
            Create smarter question papers, conduct mock tests, and gain intelligent insights to improve learning.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li>· AI Question Generation</li>
            <li>· Smart Exam Management</li>
            <li>· Advanced Analytics</li>
            <li>· Secure & Reliable</li>
          </ul>
        </div>
        <div className="pointer-events-none absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
        <p className="relative z-10 mt-auto text-sm text-slate-500">Trusted by 500+ Schools & Institutions ★★★★★</p>
      </div>
      <div className="grid place-items-center bg-[#080D1C] p-6">
        <div className="w-full max-w-md rounded-3xl border border-white/8 bg-[#11182A] p-8">
          <h1 className="text-2xl font-semibold text-white">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to MockTest AI</p>
          <p className="mt-2 mb-6 text-sm text-slate-500">
            Super admins and institution admins use email. Students use Student ID.
          </p>
          <LoginPortal defaultTab="staff" />
        </div>
      </div>
    </div>
  );
}
