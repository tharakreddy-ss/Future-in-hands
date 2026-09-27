import { withAuth } from "@/lib/with-auth";
import { testService } from "@/services/test.service";
import { requireTestAccess } from "@/lib/resource-access";
import { json } from "@/lib/utils";
export async function GET(_: Request, context: { params: Promise<{ testId: string }> }) {
  const { testId } = await context.params;
  return withAuth(async (user) => {
    const test = await requireTestAccess(user, testId);
    // Student questions are only available through the timed attempt endpoint.
    return json(user.role === "STUDENT" ? test : await testService.get(testId));
  }, ["INSTITUTION_ADMIN", "TEACHER", "STUDENT"]);
}
export async function POST(_: Request, context: { params: Promise<{ testId: string }> }) {
  const { testId } = await context.params;
  return withAuth(async (user) => {
    await requireTestAccess(user, testId);
    return json(await testService.publish(testId));
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
