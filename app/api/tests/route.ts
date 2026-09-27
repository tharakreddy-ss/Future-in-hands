import { requireClassAccess, requireSyllabusInClass } from "@/lib/resource-access";
import { withAuth } from "@/lib/with-auth";
import { testService } from "@/services/test.service";
import { testSchema } from "@/lib/validators";
import { json } from "@/lib/utils";

export async function GET(request: Request) {
  const classId = new URL(request.url).searchParams.get("classId");
  return withAuth(async (user) => {
    if (user.role === "STUDENT") {
      if (!user.studentId) return json([]);
      return json(await testService.forStudent(user.studentId));
    }
    if (!classId) return json([]);
    await requireClassAccess(user, classId);
    return json(await testService.list(classId));
  }, ["INSTITUTION_ADMIN", "TEACHER", "STUDENT"]);
}

export async function POST(request: Request) {
  return withAuth(async (user) => {
    const body = testSchema.parse(await request.json());
    await requireClassAccess(user, body.classId);
    await requireSyllabusInClass(body.syllabusId, body.classId);
    return json(await testService.create({ ...body, createdById: user.id }), 201);
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
