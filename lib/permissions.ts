import type { Role } from "@prisma/client";

export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: "/super-admin/dashboard",
  INSTITUTION_ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
};

export function canAccessPath(role: Role, pathname: string) {
  if (pathname.startsWith("/super-admin")) return role === "SUPER_ADMIN";
  if (pathname.startsWith("/admin")) return role === "INSTITUTION_ADMIN";
  if (pathname.startsWith("/teacher")) return role === "TEACHER";
  if (pathname.startsWith("/student")) return role === "STUDENT";
  return true;
}
