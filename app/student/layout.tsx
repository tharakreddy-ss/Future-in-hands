import { requireSession } from "@/lib/auth";
import { StudentApp } from "@/components/dashboard/student-shell";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession(["STUDENT"]);
  return (
    <StudentApp userName={user.name} role={user.role}>
      {children}
    </StudentApp>
  );
}
