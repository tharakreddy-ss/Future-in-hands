import { requireSession } from "@/lib/auth";
import { notificationService } from "@/services/notification.service";
import { PageHeader } from "@/components/layout/skeleton";
import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { notFound } from "next/navigation";

export default async function StudentNotificationsPage() {
  const user = await requireSession(["STUDENT"]);
  if (!user.studentId) notFound();
  await notificationService.dispatchDue(user.studentId);
  const [items, unread] = await Promise.all([
    notificationService.list(user.studentId),
    notificationService.unreadCount(user.studentId),
  ]);

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Exam schedules, reminders, and results for your account only."
      />
      <div className="mt-6">
        <NotificationsCenter items={items} unread={unread} />
      </div>
    </div>
  );
}
