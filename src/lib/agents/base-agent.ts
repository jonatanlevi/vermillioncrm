import { getAIProvider } from "@/lib/ai";
import type { ChatMessage } from "@/lib/ai/types";
import type { AgentContext, AgentId, AgentResult } from "@/lib/types/agents";

export abstract class BaseAgent {
  abstract readonly id: AgentId;
  abstract readonly systemPrompt: string;

  protected async think(userInput: string, extraContext?: string): Promise<string> {
    const ai = getAIProvider();
    const messages: ChatMessage[] = [
      { role: "system", content: this.systemPrompt },
      {
        role: "user",
        content: extraContext
          ? `${userInput}\n\n---\nContext:\n${extraContext}`
          : userInput,
      },
    ];
    return ai.complete(messages, { temperature: 0.6 });
  }

  abstract run(ctx: AgentContext): Promise<AgentResult>;
}
