import { withAuth } from "@/lib/with-auth";
import { errorJson, json } from "@/lib/utils";
import { practiceService } from "@/services/practice.service";

export async function GET() {
  return withAuth(async (user) => {
    if (!user.studentId) return errorJson("Forbidden", 403);
    const session = await practiceService.getSession(user.studentId);
    return json({ session });
  }, ["STUDENT"]);
}
