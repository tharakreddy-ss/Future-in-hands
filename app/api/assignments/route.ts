import { withAuth } from "@/lib/with-auth";
import { assignmentService } from "@/services/assignment.service";
import { assignmentSchema } from "@/lib/validators";
import { json } from "@/lib/utils";

export async function GET(request: Request) {
  const testId = new URL(request.url).searchParams.get("testId");
  return withAuth(async () => {
    if (!testId) return json([]);
    return json(await assignmentService.list(testId));
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}

export async function POST(request: Request) {
  return withAuth(async () => {
    const body = assignmentSchema.parse(await request.json());
    if (body.entireClass) {
      const test = await (await import("@/lib/db")).db.test.findUnique({ where: { id: body.testId } });
      if (!test) throw Object.assign(new Error("Test not found"), { status: 404 });
      return json(await assignmentService.assignToClass(body.testId, test.classId), 201);
    }
    return json(await assignmentService.assignToStudents(body.testId, body.studentIds ?? []), 201);
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
