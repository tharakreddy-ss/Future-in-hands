import { db } from "@/lib/db";
import { hashQuestionText } from "@/lib/question-hash";
import type { Difficulty, Prisma, QuestionSource } from "@prisma/client";
import type { QuestionOption } from "@/types";

export const questionRepository = {
  list(classId: string) {
    return db.question.findMany({
      where: { classId },
      include: { topic: true },
      orderBy: { createdAt: "desc" },
    });
  },
  get(id: string) {
    return db.question.findUnique({ where: { id }, include: { topic: true } });
  },
  create(data: {
    institutionId: string;
    classId: string;
    syllabusId?: string;
    topicId?: string;
    difficulty: Difficulty;
    questionText: string;
    explanation?: string;
    source?: QuestionSource;
    options: QuestionOption[];
    correctAnswer: string;
    subtopic?: string;
    syllabusReference?: string;
  }) {
    return db.question.create({
      data: {
        institutionId: data.institutionId,
        classId: data.classId,
        syllabusId: data.syllabusId,
        topicId: data.topicId,
        difficulty: data.difficulty,
        questionText: data.questionText,
        explanation: data.explanation,
        source: data.source ?? "MANUAL",
        optionsJson: data.options as unknown as Prisma.InputJsonValue,
        correctAnswer: data.correctAnswer,
        questionHash: hashQuestionText(data.questionText),
        subtopic: data.subtopic,
        syllabusReference: data.syllabusReference,
      },
    });
  },
};
