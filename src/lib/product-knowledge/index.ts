import {
  PRODUCT_KNOWLEDGE_BRIEF,
  PRODUCT_KNOWLEDGE_FULL,
  PRODUCT_KNOWLEDGE_VERSION,
  VERMILLION_GAMES,
} from "./vermillion";

export {
  PRODUCT_KNOWLEDGE_VERSION,
  PRODUCT_KNOWLEDGE_BRIEF,
  PRODUCT_KNOWLEDGE_FULL,
  VERMILLION_GAMES,
};

export {
  WEEKLY_PRIZE_RATIOS,
  PRODUCT_SPEC_PRIZE_TABLE,
  PRIZE_BUSINESS_MODEL,
  computePrizePoolFromInputs,
  distributeWeeklyPrizes,
  formatPrizeEconomicsForAI,
} from "./prize-economics";

export {
  fetchResolvedPrizeConfig,
  type ResolvedPrizeConfig,
} from "./prize-config";

export {
  computePrizeCalculation,
  buildDeterministicPrizeContext,
  formatPrizeCalculationsForUser,
  isPrizeMoneyQuestion,
  extractSubscriberCounts,
  type PrizeCalculationResult,
} from "./prize-calculator";

export type ProductKnowledgeLevel = "brief" | "full";

export function getProductKnowledgeText(level: ProductKnowledgeLevel): string {
  return level === "full" ? PRODUCT_KNOWLEDGE_FULL : PRODUCT_KNOWLEDGE_BRIEF;
}

/** מוסיף ידע מוצר ל-system prompt של סוכן */
export function augmentSystemPrompt(
  basePrompt: string,
  level: ProductKnowledgeLevel = "brief"
): string {
  return `${basePrompt}

---
ידע מוצר VerMillion (מקור אמת — גרסה ${PRODUCT_KNOWLEDGE_VERSION}). השתמש בזה כדי לפרש נתונים, לא להמציא חוקים:
${getProductKnowledgeText(level)}`;
}

/** הקשר מלא לסוכן אנליטיקה: מוצר + פרס חי + נתונים */
export async function buildVermillionAgentContext(dataSnapshot: string): Promise<string> {
  const { getLivePrizeContext } = await import("./live");
  const livePrize = await getLivePrizeContext();
  return [
    getProductKnowledgeText("full"),
    "",
    livePrize,
    "",
    "---",
    "נתוני משתמשים (מראה מקומית CRM — לא Supabase ישירות):",
    dataSnapshot,
  ].join("\n");
}
