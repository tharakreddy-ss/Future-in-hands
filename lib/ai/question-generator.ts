import type { Difficulty } from "@prisma/client";
import { createAIProvider } from "@/lib/ai/ai.factory";
import { validateQuestionDraft } from "@/lib/ai/question-validator";
import type { GeneratedQuestionDraft } from "@/types";

const KEYS = ["A", "B", "C", "D"] as const;

function template(topic: string, difficulty: Difficulty, index: number): GeneratedQuestionDraft {
  return {
    questionText: `Which of the following best describes ${topic} in the Indian Constitution? (variant ${index + 1})`,
    difficulty,
    explanation: `${topic} is a core unit in this syllabus.`,
    correctAnswer: "A",
    options: [
      { key: "A", text: `${topic} is a constitutionally recognized concept in this unit.` },
      { key: "B", text: `${topic} is unrelated to Indian polity.` },
      { key: "C", text: `${topic} applies only to state legislation.` },
      { key: "D", text: `${topic} was repealed by the 42nd Amendment.` },
    ],
    topicName: topic,
    subtopic: topic,
    syllabusReference: topic,
  };
}

export async function generateQuestions(input: {
  syllabusText?: string;
  topics: string[];
  count: number;
  difficulty?: Difficulty;
}): Promise<GeneratedQuestionDraft[]> {
  const difficulty = input.difficulty ?? "MEDIUM";
  const provider = createAIProvider();
  if (provider.name === "heuristic") {
    return Array.from({ length: input.count }, (_, i) =>
      template(input.topics[i % Math.max(input.topics.length, 1)] || "General", difficulty, i),
    ).filter(validateQuestionDraft);
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
    return Array.from({ length: input.count }, (_, i) =>
      template(input.topics[i % input.topics.length] ?? "General", difficulty, i),
    );
  }
  try {
    const parsed = JSON.parse(match[0]) as GeneratedQuestionDraft[];
    const valid = parsed.filter(validateQuestionDraft);
    return valid.length ? valid : Array.from({ length: input.count }, (_, i) =>
      template(input.topics[i % input.topics.length] ?? "General", difficulty, i),
    );
  } catch {
    return Array.from({ length: input.count }, (_, i) =>
      template(input.topics[i % input.topics.length] ?? "General", difficulty, i),
    );
  }
}
