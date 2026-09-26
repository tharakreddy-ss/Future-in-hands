import { questionRepository } from "@/repositories/question.repository";
import { generateQuestions } from "@/lib/ai/question-generator";
import { isDuplicateStem } from "@/lib/ai/duplicate-detector";
import { db } from "@/lib/db";
import type { Difficulty } from "@prisma/client";

export const questionService = {
  list(classId: string) {
    return questionRepository.list(classId);
  },
  async create(input: Parameters<typeof questionRepository.create>[0]) {
    return questionRepository.create(input);
  },
  async generate(input: {
    classId: string;
    count: number;
    difficulty?: Difficulty;
    topicName?: string;
    syllabusText?: string;
    syllabusId?: string;
    persist?: boolean;
  }) {
    const cls = await db.class.findUnique({ where: { id: input.classId } });
    if (!cls) throw Object.assign(new Error("Class not found"), { status: 404 });
    const syllabus = await db.syllabus.findFirst({
      where: { classId: input.classId, ...(input.syllabusId ? { id: input.syllabusId } : {}) },
      include: { topics: true },
      orderBy: { createdAt: "desc" },
    });
    const existing = await questionRepository.list(input.classId);
    const topics = input.topicName
      ? [input.topicName]
      : syllabus?.topics.map((topic) => topic.name) ?? ["General"];

    const drafts = (
      await generateQuestions({
        syllabusText: input.syllabusText ?? syllabus?.content,
        topics,
        count: input.count,
        difficulty: input.difficulty,
      })
    ).filter(
      (draft) => !isDuplicateStem(draft.questionText, existing.map((q) => q.questionText)),
    );

    const uniqueDrafts: typeof drafts = [];
    for (const draft of drafts) if (!isDuplicateStem(draft.questionText, uniqueDrafts.map((q) => q.questionText))) uniqueDrafts.push(draft);
    if (uniqueDrafts.length !== input.count) throw Object.assign(new Error("Generated questions contain duplicates. Please refine the topic and try again."), { status: 422 });
    if (!input.persist) return uniqueDrafts;

    const created = [];
    for (const draft of uniqueDrafts) {
      const topic = syllabus?.topics.find((item) => item.name === draft.topicName);
      created.push(
        await questionRepository.create({
          institutionId: cls.institutionId,
          classId: input.classId,
          syllabusId: syllabus?.id,
          topicId: topic?.id,
          difficulty: draft.difficulty,
          questionText: draft.questionText,
          explanation: draft.explanation,
          source: "AI",
          options: draft.options,
          correctAnswer: draft.correctAnswer,
          subtopic: draft.subtopic,
          syllabusReference: draft.syllabusReference,
        }),
      );
    }
    await db.aiUsage.create({
      data: {
        institutionId: cls.institutionId,
        kind: "QUESTION_GENERATION",
        questionsGenerated: created.length,
      },
    });
    return created;
  },
};
