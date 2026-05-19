import { ClaudeProvider } from "./claude";
import { GrokProvider } from "./grok";
import { GroqProvider } from "./groq";
import type { AIProvider, AIProviderName, CompletionResult } from "./types";

export const AI_NOT_CONFIGURED_MESSAGE =
  "AI לא מוגדר — הוסף GROQ_API_KEY, XAI_API_KEY, או ANTHROPIC_API_KEY ל-.env";

let cached: AIProvider | null = null;

function hasApiKey(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

class UnconfiguredAIProvider implements AIProvider {
  readonly name = "groq" as const;

  async complete(): Promise<CompletionResult> {
    throw new Error(AI_NOT_CONFIGURED_MESSAGE);
  }
}

/** בוחר provider: groq → grok → claude לפי מפתחות זמינים */
export function resolveProviderName(force?: AIProviderName): AIProviderName | "none" {
  if (force === "groq") {
    if (hasApiKey(process.env.GROQ_API_KEY)) return "groq";
    if (hasApiKey(process.env.XAI_API_KEY)) return "grok";
    if (hasApiKey(process.env.ANTHROPIC_API_KEY)) return "claude";
    return "none";
  }
  if (force === "grok") {
    if (hasApiKey(process.env.XAI_API_KEY)) return "grok";
    if (hasApiKey(process.env.GROQ_API_KEY)) return "groq";
    if (hasApiKey(process.env.ANTHROPIC_API_KEY)) return "claude";
    return "none";
  }
  if (force === "claude") {
    if (hasApiKey(process.env.ANTHROPIC_API_KEY)) return "claude";
    if (hasApiKey(process.env.GROQ_API_KEY)) return "groq";
    if (hasApiKey(process.env.XAI_API_KEY)) return "grok";
    return "none";
  }

  const preferred = (process.env.AI_PROVIDER as AIProviderName | undefined) ?? "groq";
  if (preferred === "claude") {
    if (hasApiKey(process.env.ANTHROPIC_API_KEY)) return "claude";
    if (hasApiKey(process.env.GROQ_API_KEY)) return "groq";
    if (hasApiKey(process.env.XAI_API_KEY)) return "grok";
    return "none";
  }
  if (preferred === "grok") {
    if (hasApiKey(process.env.XAI_API_KEY)) return "grok";
    if (hasApiKey(process.env.GROQ_API_KEY)) return "groq";
    if (hasApiKey(process.env.ANTHROPIC_API_KEY)) return "claude";
    return "none";
  }

  // ברירת מחדל: groq
  if (hasApiKey(process.env.GROQ_API_KEY)) return "groq";
  if (hasApiKey(process.env.XAI_API_KEY)) return "grok";
  if (hasApiKey(process.env.ANTHROPIC_API_KEY)) return "claude";
  return "none";
}

export function getAIProvider(force?: AIProviderName): AIProvider {
  const resolved = resolveProviderName(force);

  if (resolved === "none") {
    if (!force && cached instanceof UnconfiguredAIProvider) return cached;
    const unconfigured = new UnconfiguredAIProvider();
    if (!force) cached = unconfigured;
    return unconfigured;
  }

  if (!force && cached && cached.name === resolved && !(cached instanceof UnconfiguredAIProvider)) {
    return cached;
  }

  const provider: AIProvider =
    resolved === "claude"
      ? new ClaudeProvider()
      : resolved === "grok"
        ? new GrokProvider()
        : new GroqProvider();

  if (!force) cached = provider;
  return provider;
}

export * from "./types";
export { completeTracked, completeRaw, generateImageTracked } from "./complete";
export { formatUsd, formatUsdIls, estimateLlmCostUsd } from "./cost";
