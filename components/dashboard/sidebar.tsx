"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LogOut,
  GraduationCap,
  ClipboardList,
  Users,
  Settings,
  Building2,
  Shield,
  CreditCard,
  BarChart3,
  BookOpen,
} from "lucide-react";

const ICONS: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  classes: GraduationCap,
  exams: ClipboardList,
  tests: ClipboardList,
  students: Users,
  settings: Settings,
  institutions: Building2,
  admins: Shield,
  subscriptions: CreditCard,
  analytics: BarChart3,
  profile: BookOpen,
};

export function Sidebar({
  title,
  items,
}: {
  title: string;
  items: Array<{ href: string; label: string }>;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-white/10 bg-[#0e1a22] text-slate-100 md:w-64">
      <div className="px-3 py-6 md:px-5 md:py-7">
        <p className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-400 md:block">MockTest AI</p>
        <h1 className="mt-2 hidden text-lg font-semibold tracking-tight md:block">{title}</h1>
      </div>
      <nav className="flex-1 space-y-1 px-2 md:px-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const key = item.href.split("/").pop() ?? "dashboard";
          const Icon = ICONS[key] ?? LayoutDashboard;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm transition md:justify-start",
                active ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 opacity-70" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <Button variant="ghost" className="w-full text-slate-300" onClick={logout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Sign out</span>
        </Button>
      </div>
    </aside>
  );
}
