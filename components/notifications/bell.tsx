"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatNoticeTime,
  notificationTypeLabel,
  NOTIFICATIONS_UPDATED_EVENT,
  type StudentNotice,
} from "@/components/notifications/notice-helpers";

export function NotificationBell() {
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

  async function markAll() {
    if (pending || unread === 0) return;
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error("Could not mark notifications as read");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark notifications as read");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-white/10 bg-white/5 p-2"
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-[10px] text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#11182A] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-sm font-semibold">
            Notifications
            <button
              type="button"
              className="text-xs text-violet-300 disabled:opacity-50"
              disabled={pending || unread === 0}
              onClick={() => void markAll()}
            >
              {pending ? "Marking…" : "Mark all read"}
            </button>
          </div>
          {error ? <p className="px-4 py-2 text-xs text-red-400">{error}</p> : null}
          <ul className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-sm text-slate-500">No notifications yet.</li>
            ) : (
              items.slice(0, 8).map((item) => (
                <li
                  key={item.id}
                  className={cn("border-b border-white/8 px-4 py-3 text-sm", !item.readAt && "bg-violet-500/10")}
                >
                  <p className={cn(!item.readAt ? "font-semibold text-white" : "font-medium")}>{item.title}</p>
                  <p className="mt-1 text-slate-500">{item.body}</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {notificationTypeLabel(item.type)} · {formatNoticeTime(item.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/student/notifications"
            className="block border-t border-white/8 px-4 py-3 text-center text-xs font-medium text-violet-300 hover:text-white"
            onClick={() => setOpen(false)}
          >
            Open notification center
          </Link>
        </div>
      ) : null}
    </div>
  );
}
