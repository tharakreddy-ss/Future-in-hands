import { institutionRepository } from "@/repositories/institution.repository";
import { slugify } from "@/lib/utils";
import type { Plan } from "@prisma/client";

export const institutionService = {
  list() {
    return institutionRepository.list();
  },
  get(id: string) {
    return institutionRepository.get(id);
  },
  create(input: { name: string; email?: string; phone?: string; plan?: Plan }) {
    return institutionRepository.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      slug: `${slugify(input.name)}-${Date.now().toString(36)}`,
      plan: input.plan,
    });
  },
};
