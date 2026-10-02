"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, CalendarClock, CheckCheck, Radio, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatNoticeTime,
  noticeHref,
  notificationTypeLabel,
  notificationTypeTone,
  NOTIFICATIONS_UPDATED_EVENT,
  type StudentNotice,
} from "@/components/notifications/notice-helpers";

const TONE_CLASSES = {
  purple: "border-violet-400/25 bg-violet-500/12 text-violet-200",
  amber: "border-amber-400/25 bg-amber-500/12 text-amber-200",
  teal: "border-cyan-400/25 bg-cyan-500/12 text-cyan-200",
  green: "border-emerald-400/25 bg-emerald-500/12 text-emerald-200",
  slate: "border-white/10 bg-white/[0.06] text-slate-300",
} as const;

function NoticeIcon({ type }: { type: string }) {
  const className = "h-4 w-4";
  if (type === "RESULT_AVAILABLE") return <Trophy className={className} />;
  if (type === "EXAM_LIVE") return <Radio className={className} />;
  return <CalendarClock className={className} />;
}

function relativeTime(value: string | Date) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return formatNoticeTime(value);
}

export function NotificationBell() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<StudentNotice[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function load(signal?: AbortSignal) {
    const res = await fetch("/api/notifications", { signal });
    if (!res.ok) throw new Error("Could not load notifications");
    const data = (await res.json()) as { items?: StudentNotice[]; unread?: number };
    setItems(data.items ?? []);
    setUnread(data.unread ?? 0);
  }

  useEffect(() => {
    const controller = new AbortController();
    const onUpdate = () => {
      void load().catch(() => {});
    };
    const initial = window.setTimeout(() => {
      void load(controller.signal).catch(() => {});
    }, 0);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    const id = window.setInterval(() => void load().catch(() => {}), 30000);
    return () => {
      controller.abort();
      window.clearTimeout(initial);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function markRead(body: { id: string } | { all: true }) {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Could not mark notifications as read");
  }

  async function markAll() {
    if (pending || unread === 0) return;
    setPending(true);
    setError("");
    try {
      await markRead({ all: true });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark notifications as read");
    } finally {
      setPending(false);
    }
  }

  async function openNotice(item: StudentNotice) {
    const target = noticeHref(item)?.href ?? "/student/notifications";
    setOpen(false);
    if (!item.readAt) {
      setItems((rows) => rows.map((row) => (row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row)));
      setUnread((count) => Math.max(0, count - 1));
      void markRead({ id: item.id }).catch(() => void load().catch(() => {}));
    }
    router.push(target);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white",
          open && "border-violet-400/40 bg-violet-500/10 text-white",
        )}
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-[10px] font-semibold text-white ring-2 ring-[#090e1d]">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#10172a] shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-[11px] text-slate-500">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-violet-300 transition hover:bg-violet-500/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
              disabled={pending || unread === 0}
              onClick={() => void markAll()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {pending ? "Marking…" : "Mark all read"}
            </button>
          </div>
          {error ? <p className="px-4 py-2 text-xs text-red-400">{error}</p> : null}
          <ul className="max-h-[22rem] overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-slate-500">No notifications yet.</li>
            ) : (
              items.slice(0, 8).map((item) => {
                const tone = TONE_CLASSES[notificationTypeTone(item.type)];
                return (
                  <li key={item.id} className="border-b border-white/[0.06] last:border-b-0">
                    <button
                      type="button"
                      onClick={() => void openNotice(item)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition hover:bg-white/[0.05] focus:bg-white/[0.05] focus:outline-none",
                        !item.readAt && "bg-violet-500/[0.07]",
                      )}
                    >
                      <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border", tone)}>
                        <NoticeIcon type={item.type} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cn("truncate text-sm", item.readAt ? "font-medium text-slate-300" : "font-semibold text-white")}>
                            {item.title}
                          </span>
                          {!item.readAt ? <span className="h-2 w-2 shrink-0 rounded-full bg-violet-400" aria-label="Unread" /> : null}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-400">{item.body}</span>
                        <span className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                          <span className={cn("rounded-full border px-1.5 py-px", tone)}>{notificationTypeLabel(item.type)}</span>
                          <span title={formatNoticeTime(item.createdAt)}>{relativeTime(item.createdAt)}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <Link
            href="/student/notifications"
            className="flex items-center justify-center gap-1.5 border-t border-white/[0.08] px-4 py-3 text-xs font-semibold text-violet-300 transition hover:bg-white/[0.04] hover:text-white"
            onClick={() => setOpen(false)}
          >
            View all notifications
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
