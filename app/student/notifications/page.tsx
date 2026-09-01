import { requireSession } from "@/lib/auth";
import { notificationService } from "@/services/notification.service";
import { PageHeader } from "@/components/layout/skeleton";
import { Card } from "@/components/ui/card";

export default async function StudentNotificationsPage() {
  const user = await requireSession(["STUDENT"]);
  await notificationService.dispatchDue(user.studentId!);
  const items = await notificationService.list(user.studentId!);
  return (
    <div>
      <PageHeader title="Notifications" />
      <div className="mt-6 space-y-2">
        {items.map((item) => (
          <Card key={item.id}>
            <p className="font-medium">{item.title}</p>
            <p className="mt-1 text-sm text-slate-400">{item.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
