import type { SessionUser } from "@/types";

export function tenantId(user: SessionUser) {
  if (user.role === "SUPER_ADMIN") return user.institutionId;
  return user.institutionId;
}

export function requireTenant(user: SessionUser) {
  if (user.role === "SUPER_ADMIN") return null;
  if (!user.institutionId) {
    throw Object.assign(new Error("No institution on account"), { status: 403 });
  }
  return user.institutionId;
}
