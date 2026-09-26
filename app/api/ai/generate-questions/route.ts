import { requireClassAccess } from "@/lib/resource-access";
import { withAuth } from "@/lib/with-auth";
import { questionService } from "@/services/question.service";
import { generateQuestionsSchema } from "@/lib/validators";
import { json } from "@/lib/utils";

export async function POST(request: Request) {
  return withAuth(async (user) => {
    const body = generateQuestionsSchema.parse(await request.json());
    await requireClassAccess(user, body.classId);
    return json(await questionService.generate({ ...body, persist: true }));
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
