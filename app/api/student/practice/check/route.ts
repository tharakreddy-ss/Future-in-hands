import { withAuth } from "@/lib/with-auth";
import { errorJson, json } from "@/lib/utils";
import { practiceService } from "@/services/practice.service";

export async function POST(request: Request) {
  return withAuth(async (user) => {
    if (!user.studentId) return errorJson("Forbidden", 403);
    const result = await practiceService.check(user.studentId, await request.json());
    return json({ result });
  }, ["STUDENT"]);
}
