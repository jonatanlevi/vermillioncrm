import { ClaudeProvider } from "./claude";
import { GrokProvider } from "./grok";
import type { AIProvider, AIProviderName } from "./types";

let cached: AIProvider | null = null;

export function getAIProvider(force?: AIProviderName): AIProvider {
  const name =
    force ?? (process.env.AI_PROVIDER as AIProviderName | undefined) ?? "grok";

  if (!force && cached && cached.name === name) return cached;

  const provider: AIProvider =
    name === "claude" ? new ClaudeProvider() : new GrokProvider();

  if (!force) cached = provider;
  return provider;
}

export * from "./types";
