import { withAuth } from "@/lib/with-auth";
import { answerService } from "@/services/answer.service";
import { answerSchema } from "@/lib/validators";
import { json } from "@/lib/utils";

export async function POST(request: Request) {
  return withAuth(async () => {
    const body = answerSchema.parse(await request.json());
    return json(await answerService.save(body));
  }, ["STUDENT"]);
}
