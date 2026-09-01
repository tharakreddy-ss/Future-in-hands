import { AppShell } from "@/components/shell/app-shell";
import { requireSession } from "@/lib/auth";
import { navForRole } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession(["INSTITUTION_ADMIN"]);
  return (
    <AppShell items={navForRole(user.role)} role={user.role} userName={user.name}>
      {children}
    </AppShell>
  );
}
