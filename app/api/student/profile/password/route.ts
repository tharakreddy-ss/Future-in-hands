import { z } from "zod";
import { withAuth } from "@/lib/with-auth";
import { studentService } from "@/services/student.service";
import { errorJson, json } from "@/lib/utils";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters").max(72),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .strict()
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  return withAuth(async (user) => {
    if (!user.studentId) return errorJson("Forbidden", 403);
    const body = passwordSchema.parse(await request.json());
    await studentService.changeOwnPassword(user.studentId, body.currentPassword, body.newPassword);
    return json({ ok: true });
  }, ["STUDENT"]);
}
