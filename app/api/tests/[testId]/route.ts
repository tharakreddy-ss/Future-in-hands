import { withAuth } from "@/lib/with-auth";
import { testService } from "@/services/test.service";
import { errorJson, json } from "@/lib/utils";

export async function GET(_: Request, context: { params: Promise<{ testId: string }> }) {
  const { testId } = await context.params;
  return withAuth(async () => {
    const test = await testService.get(testId);
    if (!test) return errorJson("Test not found", 404);
    return json(test);
  }, ["INSTITUTION_ADMIN", "STUDENT"]);
}

export async function POST(_: Request, context: { params: Promise<{ testId: string }> }) {
  const { testId } = await context.params;
  return withAuth(async () => json(await testService.publish(testId)), ["INSTITUTION_ADMIN"]);
}
