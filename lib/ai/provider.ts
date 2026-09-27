export type AIMessage = { role: "system" | "user"; content: string };

export interface AIProvider {
  name: string;
  complete(messages: AIMessage[]): Promise<string>;
}

export class HeuristicProvider implements AIProvider {
  name = "heuristic";

  async complete(messages: AIMessage[]) {
    const last = messages.at(-1)?.content ?? "";
    return last;
  }
}

export class OpenAIProvider implements AIProvider {
  name = "openai";

  constructor(private apiKey: string) {}

  async complete(messages: AIMessage[]) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(90000),
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.4,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error ${response.status}`);
    }

    const body = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return body.choices[0]?.message.content ?? "";
  }
}
