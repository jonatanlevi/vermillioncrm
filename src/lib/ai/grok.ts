import { estimateImageCostUsd } from "./cost";
import type {
  AIProvider,
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  ImageGenerationOptions,
  ImageResult,
} from "./types";

const XAI_BASE = "https://api.x.ai/v1";
const CHAT_MODEL = "grok-2-latest";
const IMAGE_MODEL = "grok-2-image";

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
  ): Promise<CompletionResult> {
    this.ensureKey();

    const res = await fetch(`${XAI_BASE}/chat/completions`, {
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
      throw new Error(`Grok API error ${res.status}: ${err}`);
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

  async generateImage(options: ImageGenerationOptions): Promise<ImageResult> {
    this.ensureKey();

    const res = await fetch(`${XAI_BASE}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
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

    return {
      url,
      model: IMAGE_MODEL,
      costUsd: estimateImageCostUsd("grok", IMAGE_MODEL),
    };
  }
}
