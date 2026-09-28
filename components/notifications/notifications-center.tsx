"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { cn } from "@/lib/utils";
import {
  formatNoticeTime,
  noticeHref,
  notificationTypeLabel,
  notificationTypeTone,
  notifyNotificationsUpdated,
  type StudentNotice,
} from "@/components/notifications/notice-helpers";

export function NotificationsCenter({
  items,
  unread,
}: {
  items: StudentNotice[];
  unread: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"all" | string | null>(null);
  const [error, setError] = useState("");

  async function mark(body: { id?: string; all?: boolean }) {
    if (pending) return;
    setPending(body.all ? "all" : (body.id ?? "all"));
    setError("");
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not update notification");
      }
      notifyNotificationsUpdated();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update notification");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-400">
          {unread > 0
            ? `${unread} unread ${unread === 1 ? "notification" : "notifications"}`
            : items.length
              ? "You're all caught up."
              : null}
        </p>
        {unread > 0 ? (
          <Button
            type="button"
            variant="secondary"
            disabled={pending !== null}
            onClick={() => void mark({ all: true })}
          >
            {pending === "all" ? "Marking…" : "Mark all as read"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {items.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="You're all caught up. New exam and class updates will appear here."
          actionHref="/student/dashboard"
          actionLabel="Back to Dashboard"
        />
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const unreadItem = !item.readAt;
            const action = noticeHref(item);
            const related = [item.test?.title, item.test?.class.name, item.test?.class.subject].filter(Boolean);
            return (
              <li key={item.id}>
                <Card
                  className={cn(
                    "space-y-3",
                    unreadItem && "border-violet-400/35 bg-violet-500/10",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      {unreadItem ? (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-300" aria-hidden />
                      ) : (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-white/15" aria-hidden />
                      )}
                      <div>
                        <p className={cn("text-white", unreadItem ? "font-semibold" : "font-medium")}>{item.title}</p>
                        <p className="mt-1 text-sm text-slate-400">{item.body}</p>
                      </div>
                    </div>
                    <Badge tone={notificationTypeTone(item.type)}>{notificationTypeLabel(item.type)}</Badge>
                  </div>
                  {related.length ? <p className="text-xs text-slate-500">{related.join(" · ")}</p> : null}
                  <p className="text-xs text-slate-500" title={formatNoticeTime(item.createdAt)}>
                    {formatNoticeTime(item.createdAt)}
                    {unreadItem ? " · Unread" : " · Read"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {action ? (
                      <Link href={action.href} className="text-sm font-medium text-violet-300 hover:text-white">
                        {action.label}
                      </Link>
                    ) : null}
                    {item.test?.classId ? (
                      <Link
                        href={`/student/classes/${item.test.classId}`}
                        className="text-sm font-medium text-violet-300 hover:text-white"
                      >
                        View class
                      </Link>
                    ) : null}
                    {unreadItem ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-0"
                        disabled={pending !== null}
                        onClick={() => void mark({ id: item.id })}
                      >
                        {pending === item.id ? "Marking…" : "Mark as read"}
                      </Button>
                    ) : null}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
