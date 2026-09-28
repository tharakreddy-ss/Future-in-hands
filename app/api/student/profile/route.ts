import { z } from "zod";
import { withAuth } from "@/lib/with-auth";
import { createSession } from "@/lib/auth";
import { studentService } from "@/services/student.service";
import { errorJson, fullName, json } from "@/lib/utils";

const emptyToNull = (value: string | undefined) => {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
};

const profileUpdateSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().max(80),
    phone: z.string().max(32).optional(),
    gender: z.string().max(32).optional(),
    dateOfBirth: z
      .string()
      .optional()
      .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date"),
    address: z.string().max(500).optional(),
    guardianName: z.string().max(120).optional(),
    guardianPhone: z.string().max(32).optional(),
  })
  .strict();

export async function PATCH(request: Request) {
  return withAuth(async (user) => {
    if (!user.studentId) return errorJson("Forbidden", 403);
    const body = profileUpdateSchema.parse(await request.json());
    const updated = await studentService.updateOwnProfile(user.studentId, {
      firstName: body.firstName,
      lastName: body.lastName,
      phone: emptyToNull(body.phone),
      gender: emptyToNull(body.gender),
      dateOfBirth: body.dateOfBirth ? new Date(`${body.dateOfBirth}T00:00:00`) : null,
      address: emptyToNull(body.address),
      guardianName: emptyToNull(body.guardianName),
      guardianPhone: emptyToNull(body.guardianPhone),
    });
    await createSession({
      ...user,
      name: fullName(body.firstName, body.lastName),
    });
    return json({
      ok: true,
      name: updated ? fullName(updated.firstName, updated.lastName) : fullName(body.firstName, body.lastName),
    });
  }, ["STUDENT"]);
}
