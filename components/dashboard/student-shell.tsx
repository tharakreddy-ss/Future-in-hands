"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { navForRole } from "@/lib/nav";
import type { Role } from "@prisma/client";

export function StudentApp({
  children,
  userName,
  role,
}: {
  children: React.ReactNode;
  userName: string;
  role: Role;
}) {
  const pathname = usePathname();
  return (
    <AppShell
      items={navForRole(role)}
      role={role}
      userName={userName}
      hideChrome={pathname.includes("/attempt/")}
    >
      {children}
    </AppShell>
  );
}
