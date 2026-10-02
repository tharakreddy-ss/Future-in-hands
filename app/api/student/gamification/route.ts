import { withAuth } from "@/lib/with-auth";
import { errorJson, json } from "@/lib/utils";
import { gamificationService } from "@/services/gamification.service";

export async function GET() {
  return withAuth(async (user) => {
    if (!user.studentId) return errorJson("Forbidden", 403);
    return json(await gamificationService.summaryForStudent(user.studentId));
  }, ["STUDENT"]);
}
