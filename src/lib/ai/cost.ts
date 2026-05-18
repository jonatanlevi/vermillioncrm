import type { AIProviderName } from "./types";

/** מחירון משוער ל-USD (לתצוגה ב-CRM — לא חיוב אמיתי) */
const PRICE_PER_MILLION: Record<
  string,
  Record<string, { input: number; output: number }>
> = {
  grok: {
    "grok-2-latest": { input: 2, output: 10 },
    "grok-2-image": { input: 0, output: 0 },
  },
  claude: {
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
  },
};

const IMAGE_FLAT_USD: Record<string, number> = {
  "grok-2-image": 0.07,
};

export function estimateLlmCostUsd(
  provider: AIProviderName | string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rates = PRICE_PER_MILLION[provider]?.[model] ?? { input: 3, output: 15 };
  return (
    (inputTokens / 1_000_000) * rates.input + (outputTokens / 1_000_000) * rates.output
  );
}

export function estimateImageCostUsd(provider: string, model: string): number {
  if (provider === "grok") return IMAGE_FLAT_USD[model] ?? 0.07;
  return 0.04;
}

export function formatUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(2)}`;
}

export function formatUsdIls(usd: number, rate = 3.7): string {
  return `${formatUsd(usd)} (≈₪${(usd * rate).toFixed(2)})`;
}
