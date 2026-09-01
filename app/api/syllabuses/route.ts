import { withAuth } from "@/lib/with-auth";
import { syllabusService } from "@/services/syllabus.service";
import { syllabusSchema } from "@/lib/validators";
import { json } from "@/lib/utils";

export async function GET(request: Request) {
  const classId = new URL(request.url).searchParams.get("classId");
  return withAuth(async () => {
    if (!classId) return json([]);
    return json(await syllabusService.list(classId));
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}

export async function POST(request: Request) {
  return withAuth(async (user) => {
    const body = syllabusSchema.parse(await request.json());
    return json(await syllabusService.create({ ...body, createdById: user.id }), 201);
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
