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
    return json(await testService.list(classId));
  }, ["INSTITUTION_ADMIN", "TEACHER", "STUDENT"]);
}

export async function POST(request: Request) {
  return withAuth(async () => {
    const body = testSchema.parse(await request.json());
    return json(await testService.create(body), 201);
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
