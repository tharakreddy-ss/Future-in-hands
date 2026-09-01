import { HeuristicProvider, OpenAIProvider, type AIProvider } from "@/lib/ai/provider";

export function createAIProvider(): AIProvider {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (key) return new OpenAIProvider(key);
  return new HeuristicProvider();
}
