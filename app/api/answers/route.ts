import { withAuth } from "@/lib/with-auth";
import { answerService } from "@/services/answer.service";
import { answerSchema } from "@/lib/validators";
import { json } from "@/lib/utils";

export async function POST(request: Request) {
  return withAuth(async (user) => {
    const body = answerSchema.parse(await request.json());
    if (!user.studentId) return json({ error: "Student profile missing" }, 403);
    return json(await answerService.save(body, user.studentId));
  }, ["STUDENT"]);
}
