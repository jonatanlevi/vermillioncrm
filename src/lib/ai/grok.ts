import type {
  AIProvider,
  ChatMessage,
  CompletionOptions,
  ImageGenerationOptions,
} from "./types";

const XAI_BASE = "https://api.x.ai/v1";

export class GrokProvider implements AIProvider {
  readonly name = "grok" as const;
  private apiKey: string;

  constructor(apiKey = process.env.XAI_API_KEY ?? "") {
    this.apiKey = apiKey;
  }

  private ensureKey() {
    if (!this.apiKey) {
      throw new Error("XAI_API_KEY is not set. Add it to .env for Grok.");
    }
  }

  async complete(
    messages: ChatMessage[],
    options?: CompletionOptions
  ): Promise<string> {
    this.ensureKey();

    const res = await fetch(`${XAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Grok API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  }

  async generateImage(options: ImageGenerationOptions): Promise<{ url: string }> {
    this.ensureKey();

    const res = await fetch(`${XAI_BASE}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-image",
        prompt: options.prompt,
        n: 1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Grok image API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as { data?: { url?: string }[] };
    const url = data.data?.[0]?.url;
    if (!url) throw new Error("Grok returned no image URL");
    return { url };
  }
}
