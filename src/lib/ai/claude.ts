import type {
  AIProvider,
  ChatMessage,
  CompletionOptions,
} from "./types";

const ANTHROPIC_BASE = "https://api.anthropic.com/v1";

/** Stub-ready Claude provider — switch AI_PROVIDER=claude when ready */
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
  ): Promise<string> {
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
        model: "claude-sonnet-4-20250514",
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
    };
    const block = data.content?.find((c) => c.type === "text");
    return block?.text ?? "";
  }
}
