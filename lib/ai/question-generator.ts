import type { Difficulty } from "@prisma/client";
import { z } from "zod";
import { createAIProvider } from "@/lib/ai/ai.factory";
import { validateQuestionDraft } from "@/lib/ai/question-validator";
import type { GeneratedQuestionDraft } from "@/types";

const KEYS = ["A", "B", "C", "D"] as const;
const draftSchema = z.object({
  questionText: z.string().min(8),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  explanation: z.string(),
  correctAnswer: z.enum(KEYS),
  options: z.array(z.object({ key: z.enum(KEYS), text: z.string().min(1) })).length(4),
  topicName: z.string().optional(),
  subtopic: z.string().optional(),
  syllabusReference: z.string().optional(),
});

export async function generateQuestions(input: {
  syllabusText?: string;
  topics: string[];
  count: number;
  difficulty?: Difficulty;
}): Promise<GeneratedQuestionDraft[]> {
  const difficulty = input.difficulty ?? "MIXED: approximately 30% EASY, 50% MEDIUM, 20% HARD";
  const provider = createAIProvider();
  if (provider.name === "heuristic") {
    throw Object.assign(new Error("AI question generation is unavailable. Configure an AI provider key before generating questions."), { status: 503 });
  }

  const content = await provider.complete([
    {
      role: "system",
      content: `Return JSON array of MCQs: [{questionText,difficulty,explanation,correctAnswer,options:[{key,text}],topicName,subtopic,syllabusReference}]. Keys must be ${KEYS.join(",")}. Exactly one correctAnswer.`,
    },
    {
      role: "user",
      content: JSON.stringify({
        count: input.count,
        difficulty,
        topics: input.topics,
        syllabus: input.syllabusText?.slice(0, 4000),
      }),
    },
  ]);

  const match = content.match(/\[[\s\S]*\]/);
  if (!match) {
    throw Object.assign(new Error("The AI provider returned an invalid response. Please try generating the questions again."), { status: 502 });
  }
  try {
    const parsed = z.array(draftSchema).parse(JSON.parse(match[0])) as GeneratedQuestionDraft[];
    const valid = parsed.filter(validateQuestionDraft);
    if (valid.length !== input.count) {
      throw Object.assign(new Error(`The AI returned ${valid.length} valid questions; ${input.count} were requested. Please review the syllabus and retry.`), { status: 502 });
    }
    return valid;
  } catch {
    throw Object.assign(new Error("The AI response did not contain valid questions. Please try again or use the question bank."), { status: 502 });
  }
}
