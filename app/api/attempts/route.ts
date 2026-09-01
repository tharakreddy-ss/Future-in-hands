import { withAuth } from "@/lib/with-auth";
import { attemptService } from "@/services/attempt.service";
import { json } from "@/lib/utils";
import { z } from "zod";

export async function POST(request: Request) {
  return withAuth(async (user) => {
    const body = z.object({ assignmentId: z.string() }).parse(await request.json());
    return json(await attemptService.start(body.assignmentId, user.studentId!), 201);
  }, ["STUDENT"]);
}
