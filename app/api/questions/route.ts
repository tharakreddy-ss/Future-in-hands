import { requireClassAccess, requireSyllabusInClass } from "@/lib/resource-access";
import { withAuth } from "@/lib/with-auth";
import { questionService } from "@/services/question.service";
import { questionSchema } from "@/lib/validators";
import { json } from "@/lib/utils";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const classId = new URL(request.url).searchParams.get("classId");
  return withAuth(async (user) => {
    if (!classId) return json([]);
    await requireClassAccess(user, classId);
    return json(await questionService.list(classId));
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}

export async function POST(request: Request) {
  return withAuth(async (user) => {
    const body = questionSchema.parse(await request.json());
    await requireSyllabusInClass(body.syllabusId, body.classId);
    if (body.topicId && !(await db.syllabusTopic.findFirst({ where: { id: body.topicId, syllabus: { classId: body.classId, ...(body.syllabusId ? { id: body.syllabusId } : {}) } } }))) throw Object.assign(new Error("Topic not found"), { status: 404 });
    const cls = await db.class.findUnique({ where: { id: body.classId } });
    if (!cls || cls.institutionId !== user.institutionId) {
      throw Object.assign(new Error("Class not found"), { status: 404 });
    }
    return json(
      await questionService.create({
        institutionId: cls.institutionId,
        classId: body.classId,
        syllabusId: body.syllabusId,
        topicId: body.topicId,
        difficulty: body.difficulty,
        questionText: body.questionText,
        explanation: body.explanation,
        options: body.options,
        correctAnswer: body.correctAnswer,
      }),
      201,
    );
  }, ["INSTITUTION_ADMIN", "TEACHER"]);
}
