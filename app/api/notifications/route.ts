import { withAuth } from "@/lib/with-auth";
import { notificationService } from "@/services/notification.service";
import { json } from "@/lib/utils";
import { z } from "zod";

export function GET() {
  return withAuth(async (user) => {
    if (!user.studentId) return json({ items: [], unread: 0 });
    await notificationService.dispatchDue(user.studentId);
    const [items, unread] = await Promise.all([
      notificationService.list(user.studentId),
      notificationService.unreadCount(user.studentId),
    ]);
    return json({ items, unread });
  }, ["STUDENT"]);
}

export async function POST(request: Request) {
  return withAuth(async (user) => {
    if (!user.studentId) return json({ ok: true });
    const body = z.object({ id: z.string().optional(), all: z.boolean().optional() }).parse(await request.json());
    if (body.all) await notificationService.markAllRead(user.studentId);
    else if (body.id) await notificationService.markRead(body.id, user.studentId);
    return json({ ok: true });
  }, ["STUDENT"]);
}
