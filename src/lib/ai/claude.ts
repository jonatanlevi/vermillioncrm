import type {
  AIProvider,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
} from "./types";

const ANTHROPIC_BASE = "https://api.anthropic.com/v1";
const CHAT_MODEL = "claude-sonnet-4-20250514";

export class ClaudeProvider implements AIProvider {
  readonly name = "claude" as const;
  private apiKey: string;

  constructor(apiKey = process.env.ANTHROPIC_API_KEY ?? "") {
    this.apiKey = apiKey;
  }

  private ensureKey() {
    if (!this.apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set. Add it to .env for Claude.");
    }
  }

  async complete(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): Promise<CompletionResult> {
    this.ensureKey();

    const system = messages.find((m) => m.role === "system")?.content;
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    const res = await fetch(`${ANTHROPIC_BASE}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: options?.maxTokens ?? 4096,
        system,
        messages: chatMessages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Claude API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const block = data.content?.find((c) => c.type === "text");

    return {
      text: block?.text ?? "",
      model: CHAT_MODEL,
      usage: {
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
      },
    };
  }
}
