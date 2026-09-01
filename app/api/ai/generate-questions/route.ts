import { withAuth } from "@/lib/with-auth";
import { questionService } from "@/services/question.service";
import { generateQuestionsSchema } from "@/lib/validators";
import { json } from "@/lib/utils";

export async function POST(request: Request) {
  return withAuth(async () => {
    const body = generateQuestionsSchema.parse(await request.json());
    return json(await questionService.generate({ ...body, persist: true }));
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
