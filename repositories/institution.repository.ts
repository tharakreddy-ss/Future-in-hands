import { db } from "@/lib/db";
import type { Plan, SubscriptionStatus } from "@prisma/client";

export const institutionRepository = {
  list() {
    return db.institution.findMany({
      include: { _count: { select: { users: true, students: true, classes: true, tests: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
  get(id: string) {
    return db.institution.findUnique({
      where: { id },
      include: { users: true, classes: true, students: true },
    });
  },
  create(data: {
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    plan?: Plan;
    status?: SubscriptionStatus;
  }) {
    return db.institution.create({
      data: {
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        subscriptionPlan: data.plan ?? "STARTER",
        subscriptionStatus: data.status ?? "TRIAL",
      },
    });
  },
};
