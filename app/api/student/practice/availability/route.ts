import { withAuth } from "@/lib/with-auth";
import { errorJson, json } from "@/lib/utils";
import { practiceService } from "@/services/practice.service";

export async function GET(request: Request) {
  return withAuth(async (user) => {
    if (!user.studentId) return errorJson("Forbidden", 403);
    const params = new URL(request.url).searchParams;
    const available = await practiceService.availableBankCount(user.studentId, {
      classId: params.get("classId") ?? "",
      subjectKey: params.get("subjectKey") ?? "",
      topicKey: params.get("topicKey") ?? "",
      difficulty: params.get("difficulty") ?? "ANY",
    });
    return json({ available });
  }, ["STUDENT"]);
}
