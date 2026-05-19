import { estimateLlmCostUsd } from "./cost";
import type {
  AIProvider,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
} from "./types";

const GROQ_BASE = "https://api.groq.com/openai/v1";
const CHAT_MODEL = "llama-3.3-70b-versatile";

export class GroqProvider implements AIProvider {
  readonly name = "groq" as const;
  private apiKey: string;

  constructor(apiKey = process.env.GROQ_API_KEY ?? "") {
    this.apiKey = apiKey;
  }

  private ensureKey() {
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY is not set. Add it to .env for Groq.");
    }
  }

  async complete(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): Promise<CompletionResult> {
    this.ensureKey();

    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    return {
      text: data.choices?.[0]?.message?.content ?? "",
      model: CHAT_MODEL,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }
}
