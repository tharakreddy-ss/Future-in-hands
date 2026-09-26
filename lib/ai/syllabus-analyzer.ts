import { createAIProvider } from "@/lib/ai/ai.factory";
import type { SyllabusAnalysis } from "@/types";

function fallbackAnalyze(rawText: string): SyllabusAnalysis {
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-*•\d.)]+/, "").trim())
    .filter((line) => line.length > 3);

  const topics = lines.slice(0, 12).map((name) => ({
    name,
    weightage: Math.round(100 / Math.max(lines.slice(0, 12).length, 1)),
    subtopics: [] as string[],
  }));

  return {
    summary: `Text-based draft (AI unavailable): ${topics.length} topics. Review the topics before generating questions.`,
    topics: topics.length ? topics : [{ name: "General", weightage: 100, subtopics: [] }],
  };
}

export async function analyzeSyllabus(rawText: string): Promise<SyllabusAnalysis> {
  const provider = createAIProvider();
  if (provider.name === "heuristic") return fallbackAnalyze(rawText);

  const content = await provider.complete([
    {
      role: "system",
      content:
        "Return JSON only: {summary:string, topics:[{name:string,weightage:number,subtopics:string[]}]}",
    },
    { role: "user", content: rawText.slice(0, 8000) },
  ]);

  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return fallbackAnalyze(rawText);
  try {
    return JSON.parse(match[0]) as SyllabusAnalysis;
  } catch {
    return fallbackAnalyze(rawText);
  }
}
