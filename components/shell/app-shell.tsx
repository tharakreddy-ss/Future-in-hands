"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  Users,
  Settings,
  Building2,
  Shield,
  BarChart3,
  BookOpen,
  Sparkles,
  FileText,
  Bell,
  HelpCircle,
  Layers,
  Library,
  UserRound,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/shell/global-search";
import { NotificationBell } from "@/components/notifications/bell";
import { createActionFor, type NavItem, type NavKey } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

const ICONS: Record<NavKey, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  classes: GraduationCap,
  subjects: Layers,
  exams: ClipboardList,
  questions: Library,
  students: Users,
  teachers: UserRound,
  generate: Sparkles,
  analytics: BarChart3,
  reports: FileText,
  settings: Settings,
  institutions: Building2,
  users: Users,
  roles: Shield,
  profile: BookOpen,
  notifications: Bell,
  help: HelpCircle,
};

export function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-1">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#4F6BFF] shadow-[0_0_20px_rgba(124,58,237,0.4)]">
        <Sparkles className="h-4 w-4 text-white" />
      </span>
      {compact ? null : (
        <span>
          <span className="block text-sm font-semibold tracking-tight text-white">MOCKTEST AI</span>
          <span className="block text-[10px] text-slate-500">Smart Exams. Better Learning.</span>
        </span>
      )}
    </Link>
  );
}

export function AppShell({
  children,
  items,
  role,
  userName,
  hideChrome = false,
}: {
  children: React.ReactNode;
  items: NavItem[];
  role: Role;
  userName: string;
  hideChrome?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const create = createActionFor(role);
  const roleLabel =
    role === "SUPER_ADMIN"
      ? "Super Admin"
      : role === "INSTITUTION_ADMIN"
        ? "Institution Admin"
        : role === "TEACHER"
          ? "Teacher"
          : "Student";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (hideChrome) {
    return <div className="page-canvas min-h-screen">{children}</div>;
  }

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition",
              active
                ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(124,58,237,0.35)]"
                : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 opacity-80" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#080D1C] text-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/8 bg-[#0B1020] lg:flex">
        <div className="px-4 py-6">
          <BrandLockup />
        </div>
        {nav}
        <div className="border-t border-white/8 p-3">
          <div className="mb-2 rounded-xl border border-white/8 bg-white/5 px-3 py-3">
            <p className="truncate text-sm font-medium text-white">{userName}</p>
            <p className="text-xs text-slate-500">{roleLabel}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start" onClick={() => void logout()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-[#0B1020]">
            <div className="flex items-center justify-between px-4 py-5">
              <BrandLockup />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 bg-[#080D1C]/80 px-4 py-3 backdrop-blur-xl md:px-6">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <GlobalSearch />
          <Link
            href={create.href}
            className="hidden rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.28)] sm:inline-flex"
          >
            + {create.label}
          </Link>
          {role === "STUDENT" ? <NotificationBell /> : <Bell className="h-5 w-5 text-slate-400" />}
        </header>
        <main className="page-canvas flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
