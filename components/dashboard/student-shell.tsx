"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  ChevronRight,
  ChevronsLeft,
  ClipboardList,
  FileCheck,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  Target,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { GlobalSearch } from "@/components/shell/global-search";
import { NotificationBell } from "@/components/notifications/bell";
import { StudentAvatar } from "@/components/students/student-avatar";
import { createActionFor, navForRole, STUDENT_SIDEBAR_COOKIE, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";

export type StudentShellContext = {
  name: string;
  firstName: string;
  studentIdentifier: string | null;
  className: string | null;
  academicYear: string | null;
  photoUrl: string | null;
};

const NAV_ICONS: Record<string, LucideIcon> = {
  "/student/dashboard": LayoutDashboard,
  "/student/tests": ClipboardList,
  "/student/practice": Target,
  "/student/results": FileCheck,
  "/student/analytics": BarChart3,
  "/student/notifications": Bell,
  "/student/profile": UserRound,
  "/student/help": HelpCircle,
};

const ICON_CLASS = "h-[18px] w-[18px] shrink-0";
const ICON_STROKE = 1.75;

function isActive(item: NavItem, pathname: string) {
  return [item.href, ...(item.activePrefixes ?? [])].some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

function Avatar({ context }: { context: StudentShellContext }) {
  return (
    <span className="inline-flex shrink-0 overflow-hidden rounded-full">
      <StudentAvatar name={context.name} photoUrl={context.photoUrl} size="sm" />
    </span>
  );
}

/** Label that stays mounted and fades, so collapsing never reflows the icons. */
function FadeLabel({ collapsed, className, children }: { collapsed: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "min-w-0 whitespace-nowrap transition-opacity duration-150 motion-reduce:transition-none",
        collapsed ? "pointer-events-none opacity-0" : "opacity-100 delay-75",
        className,
      )}
    >
      {children}
    </span>
  );
}

function NavLinks({
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav
      aria-label="Student navigation"
      className={cn("flex-1 px-3 py-2", collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden")}
    >
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isActive(item, pathname);
          const Icon = NAV_ICONS[item.href] ?? LayoutDashboard;
          return (
            <li key={item.href} className="group relative">
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center gap-3 overflow-hidden rounded-lg px-[15px] text-sm transition-[background-color,color,box-shadow,scale] duration-200 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 motion-reduce:transition-none",
                  active
                    ? "bg-gradient-to-r from-violet-500/[0.18] to-violet-500/[0.06] font-medium text-white shadow-[inset_0_0_0_1px_rgba(167,139,250,0.18),0_0_18px_-6px_rgba(139,92,246,0.55)]"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.9)] transition-opacity duration-200",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon
                  className={cn(
                    ICON_CLASS,
                    "transition-[color,translate] duration-200 ease-out motion-reduce:transition-none",
                    active ? "text-violet-300" : "group-hover:translate-x-0.5",
                  )}
                  strokeWidth={ICON_STROKE}
                  aria-hidden
                />
                <FadeLabel collapsed={collapsed}>{item.label}</FadeLabel>
              </Link>
              {collapsed ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#161e33] px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {item.label}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ProfileMenu({ context, collapsed, onLogout }: { context: StudentShellContext; collapsed: boolean; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[0]?.focus();
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function onMenuKeyDown(event: React.KeyboardEvent) {
    const items = itemRefs.current.filter((item): item is HTMLElement => Boolean(item));
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else if (event.key === "Tab") setOpen(false);
    if (next >= 0) {
      event.preventDefault();
      items[next]?.focus();
    }
  }

  const itemClass =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:bg-white/[0.06] focus-visible:text-white focus-visible:outline-none";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="student-profile-menu"
        aria-label={`Account menu for ${context.name}`}
        className={cn(
          "flex h-14 w-full items-center gap-3 overflow-hidden rounded-xl px-[9px] text-left transition-[background-color,scale] duration-200 ease-out hover:bg-white/[0.05] active:scale-[0.98] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60",
          open && "bg-white/[0.05]",
        )}
      >
        <Avatar context={context} />
        <FadeLabel collapsed={collapsed} className="flex flex-1 items-center justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-white">{context.name}</span>
            <span className="block truncate text-xs text-slate-500">{context.studentIdentifier ?? "Student"}</span>
          </span>
          <ChevronRight className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", open && "-rotate-90")} aria-hidden />
        </FadeLabel>
      </button>

      {open ? (
        <div
          id="student-profile-menu"
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
          className="absolute bottom-full left-0 z-50 mb-2 w-60 rounded-xl border border-white/10 bg-[#121a2e] p-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)]"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-3 pb-2.5 pt-1.5">
            <Avatar context={context} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{context.name}</p>
              <p className="truncate text-xs text-slate-500">{context.studentIdentifier ?? "Student"}</p>
            </div>
          </div>
          <div className="pt-1.5">
            <Link
              ref={(node) => {
                itemRefs.current[0] = node;
              }}
              role="menuitem"
              href="/student/profile"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <UserRound className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
              Profile
            </Link>
            <Link
              ref={(node) => {
                itemRefs.current[1] = node;
              }}
              role="menuitem"
              href="/student/help"
              onClick={() => setOpen(false)}
              className={itemClass}
            >
              <HelpCircle className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
              Help
            </Link>
            <button
              ref={(node) => {
                itemRefs.current[2] = node;
              }}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className={cn(itemClass, "text-rose-300 hover:text-rose-200 focus-visible:text-rose-200")}
            >
              <LogOut className="h-4 w-4" strokeWidth={ICON_STROKE} aria-hidden />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      href="/student/dashboard"
      aria-label="MOCKTEST AI dashboard"
      className="flex items-center gap-2.5 overflow-hidden rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#4F6BFF]">
        <Sparkles className="h-4 w-4 text-white" aria-hidden />
      </span>
      <FadeLabel collapsed={collapsed}>
        <span className="block text-sm font-semibold tracking-tight text-white">MOCKTEST AI</span>
        <span className="block text-[10px] text-slate-500">Smart Exams. Better Learning.</span>
      </FadeLabel>
    </Link>
  );
}

export function StudentApp({
  children,
  role,
  context,
  initialCollapsed,
}: {
  children: React.ReactNode;
  role: Role;
  context: StudentShellContext;
  initialCollapsed: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const items = navForRole(role);
  const create = createActionFor(role);

  if (pathname.includes("/attempt/")) {
    return <div className="page-canvas min-h-screen">{children}</div>;
  }

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${STUDENT_SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const contextLine = [context.className, context.academicYear, context.studentIdentifier].filter(Boolean).join(" · ");

  return (
    <div className="flex h-dvh overflow-hidden bg-[#080D1C] text-slate-100 print:block print:h-auto print:overflow-visible print:bg-white print:text-black">
      <aside
        data-static-controls
        className={cn(
          "relative z-40 hidden shrink-0 flex-col border-r border-white/[0.07] bg-[#0b1122] transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex print:!hidden",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <div className="flex h-16 shrink-0 items-center px-3">
          <Brand collapsed={collapsed} />
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-[22px] z-50 grid h-6 w-6 place-items-center rounded-full border border-white/15 bg-[#161e33] text-slate-300 shadow-md transition-colors hover:border-violet-400/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
        >
          <ChevronsLeft
            className={cn("h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none", collapsed && "rotate-180")}
            aria-hidden
          />
        </button>
        <NavLinks items={items} pathname={pathname} collapsed={collapsed} />
        <div className="shrink-0 border-t border-white/[0.07] p-2">
          <ProfileMenu context={context} collapsed={collapsed} onLogout={() => void logout()} />
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" data-static-controls>
          <button className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[#0b1122]">
            <div className="flex h-16 items-center justify-between px-3">
              <Brand collapsed={false} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-slate-300 hover:bg-white/[0.06]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <NavLinks items={items} pathname={pathname} collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-white/[0.07] p-2">
              <ProfileMenu context={context} collapsed={false} onLogout={() => void logout()} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#0a1020]/95 px-4 backdrop-blur md:px-6 print:hidden">
          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <div className="hidden min-w-0 shrink md:block md:max-w-[16rem] xl:max-w-[22rem]">
            <p className="truncate text-sm font-semibold text-white">Welcome back, {context.firstName}</p>
            <p className="truncate text-xs text-slate-500">{contextLine || "Student portal"}</p>
          </div>
          <div className="flex min-w-0 flex-1 justify-end">
            <div className="flex w-full max-w-xs">
              <GlobalSearch />
            </div>
          </div>
          {create ? (
            <Link
              href={create.href}
              className="hidden shrink-0 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 xl:inline-flex"
            >
              + {create.label}
            </Link>
          ) : null}
          <NotificationBell />
        </header>
        <main id="student-main" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain print:overflow-visible">
          <div className="page-canvas min-h-full">
            <div className="mx-auto w-full max-w-[1440px] p-4 md:p-6 xl:p-8 print:p-0">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
