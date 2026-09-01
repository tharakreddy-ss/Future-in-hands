import { AppShell } from "@/components/shell/app-shell";
import { requireSession } from "@/lib/auth";
import { navForRole } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession(["TEACHER"]);
  return (
    <AppShell items={navForRole(user.role)} role={user.role} userName={user.name}>
      {children}
    </AppShell>
  );
}
