"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type Notice = { id: string; title: string; body: string; readAt: string | null; createdAt: string };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<Notice[]>([]);

  async function load() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.items ?? []);
    setUnread(data.unread ?? 0);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/notifications", { signal: controller.signal }).then((res) => res.json()).then((data) => { setItems(data.items ?? []); setUnread(data.unread ?? 0); }).catch(() => {});
    const id = setInterval(() => void load(), 30000);
    return () => { controller.abort(); clearInterval(id); };
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    void load();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-white/10 bg-white/5 p-2"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-[10px] text-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#11182A] shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3 text-sm font-semibold">
            Notifications
            <button type="button" className="text-xs text-violet-300" onClick={() => void markAll()}>
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 overflow-auto">
            {items.length === 0 ? (
              <li className="px-4 py-6 text-sm text-slate-500">No notifications yet.</li>
            ) : (
              items.map((item) => (
                <li key={item.id} className={cn("border-b border-white/8 px-4 py-3 text-sm", !item.readAt && "bg-violet-500/10")}>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-slate-500">{item.body}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
