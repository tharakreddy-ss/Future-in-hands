import { db } from "@/lib/db";
import { analyzeSyllabus } from "@/lib/ai/syllabus-analyzer";

export const syllabusService = {
  list(classId: string) {
    return db.syllabus.findMany({
      where: { classId },
      include: { topics: true },
      orderBy: { createdAt: "desc" },
    });
  },
  async create(input: {
    classId: string;
    title: string;
    content: string;
    inputType?: "TOPIC" | "TEXT" | "IMAGE" | "PDF";
    createdById?: string;
  }) {
    const cls = await db.class.findUnique({ where: { id: input.classId } });
    if (!cls) throw Object.assign(new Error("Class not found"), { status: 404 });
    const analysis = await analyzeSyllabus(input.content);
    return db.syllabus.create({
      data: {
        institutionId: cls.institutionId,
        classId: input.classId,
        title: input.title,
        inputType: input.inputType ?? "TEXT",
        content: input.content,
        analyzedJson: analysis,
        createdById: input.createdById,
        topics: {
          create: analysis.topics.map((topic) => ({
            name: topic.name,
            weightage: topic.weightage,
          })),
        },
      },
      include: { topics: true },
    });
  },
};
