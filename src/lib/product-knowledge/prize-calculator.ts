/**
 * מחשבון פרסים דטרמיניסטי — מקור אמת לסכומים (לא LLM).
 * לוגיקה זהה ל-million/vermillion/api/prize-pool.js
 */
import {
  WEEKLY_PLACE_LABELS,
  WEEKLY_PRIZE_RATIOS,
  distributeWeeklyPrizes,
} from "./prize-economics";
import type { ResolvedPrizeConfig } from "./prize-config";

export type PrizeCalculationResult = {
  activeSubscribers: number;
  monthlyPriceIls: number;
  monthlyRevenue: number;
  operationalCosts: number;
  operationalCostMethod: "actual_month" | "percent_estimate";
  netRevenue: number;
  monthlyPrizePool: number;
  clubProfitMonthly: number;
  weeklyPrizePoolGross: number;
  weeklyPrizeNet: number;
  withholdingTaxPct: number;
  weeklyPlaces: number[];
  prizePoolPct: number;
};

export type PrizeCalculationOptions = {
  /** לחישוב «מה אם» — תמיד אחוז, לא עלויות בפועל של חודש נוכחי */
  hypothetical?: boolean;
};

/** חישוב זהה ל-prize-pool.js */
export function computePrizeCalculation(
  activeSubscribers: number,
  config: ResolvedPrizeConfig,
  options: PrizeCalculationOptions = {}
): PrizeCalculationResult {
  const n = Math.max(0, Math.floor(activeSubscribers));
  const monthlyPriceIls = config.monthlyPriceIls;
  const monthlyRevenue = n * monthlyPriceIls;

  let operationalCosts: number;
  let operationalCostMethod: PrizeCalculationResult["operationalCostMethod"];

  const useActual =
    !options.hypothetical &&
    config.actualOperationalCostsThisMonth > 0 &&
    n > 0;

  if (useActual) {
    operationalCosts = config.actualOperationalCostsThisMonth;
    operationalCostMethod = "actual_month";
  } else {
    operationalCosts = monthlyRevenue * (config.operationalCostPct / 100);
    operationalCostMethod = "percent_estimate";
  }

  const netRevenue = Math.max(0, monthlyRevenue - operationalCosts);
  const monthlyPrizePool = netRevenue * (config.prizePoolPct / 100);
  const clubProfitMonthly = netRevenue * (config.clubProfitPct / 100);
  const weeklyPrizePoolGross = monthlyPrizePool / 4;
  const weeklyPrizeNet =
    weeklyPrizePoolGross * (1 - config.withholdingTaxPct / 100);
  const weeklyPlaces = distributeWeeklyPrizes(Math.round(weeklyPrizeNet));

  return {
    activeSubscribers: n,
    monthlyPriceIls,
    monthlyRevenue: Math.round(monthlyRevenue),
    operationalCosts: Math.round(operationalCosts),
    operationalCostMethod,
    netRevenue: Math.round(netRevenue),
    monthlyPrizePool: Math.round(monthlyPrizePool),
    clubProfitMonthly: Math.round(clubProfitMonthly),
    weeklyPrizePoolGross: Math.round(weeklyPrizePoolGross),
    weeklyPrizeNet: Math.round(weeklyPrizeNet),
    withholdingTaxPct: config.withholdingTaxPct,
    weeklyPlaces,
    prizePoolPct: config.prizePoolPct,
  };
}

const PRIZE_QUESTION =
  /פרס|קופה|זוכ|הגרל|מנוי|חלוק|ירוויח|שבועי|הכנסה|נטו|מקום\s*[1-5]|כמה.*(ירוויח|מקבל|זוכה)/iu;

const HEBREW_NUMBERS: Record<string, number> = {
  "חמישים": 50,
  "מאה": 100,
  "מאתיים": 200,
  "חמש מאות": 500,
  "אלף": 1000,
  "אלפיים": 2000,
  "חמשת אלפים": 5000,
  "חמש אלפים": 5000,
};

export function isPrizeMoneyQuestion(text: string): boolean {
  return PRIZE_QUESTION.test(text.trim());
}

export function extractSubscriberCounts(text: string): number[] {
  const found = new Set<number>();
  const normalized = text.replace(/,/g, "").trim();

  for (const [phrase, value] of Object.entries(HEBREW_NUMBERS)) {
    if (normalized.includes(phrase)) found.add(value);
  }

  for (const m of normalized.matchAll(/\d+/g)) {
    const n = parseInt(m[0], 10);
    if (n > 0 && n <= 5_000_000) found.add(n);
  }

  return [...found].sort((a, b) => a - b);
}

function ils(n: number): string {
  return `₪${n.toLocaleString("he-IL")}`;
}

function formatOneCalculation(
  result: PrizeCalculationResult,
  config: ResolvedPrizeConfig,
  title: string
): string {
  const opNote =
    result.operationalCostMethod === "actual_month"
      ? `עלויות תפעול בפועל לחודש נוכחי (${ils(result.operationalCosts)})`
      : `עלויות תפעול משוערות: ${config.operationalCostPct}% מההכנסה = ${ils(result.operationalCosts)}`;

  const lines = [
    `### ${title}`,
    "",
    "| שלב | נוסחה | סכום |",
    "|------|--------|------|",
    `| מנויים premium פעילים | — | ${result.activeSubscribers.toLocaleString("he-IL")} |`,
    `| הכנסה חודשית | ${result.activeSubscribers} × ${ils(result.monthlyPriceIls)} | ${ils(result.monthlyRevenue)} |`,
    `| הוצאות תפעול | ${opNote} | ${ils(result.operationalCosts)} |`,
    `| נטו | ${ils(result.monthlyRevenue)} − ${ils(result.operationalCosts)} | **${ils(result.netRevenue)}** |`,
    `| קרן פרסים (${result.prizePoolPct}% נטו) | חודשי | **${ils(result.monthlyPrizePool)}** |`,
    `| קופה שבועית (÷4) | ברוטו | ${ils(result.weeklyPrizePoolGross)} |`,
    ...(result.withholdingTaxPct > 0
      ? [
          `| ניכוי מס במקור | ${result.withholdingTaxPct}% | — |`,
          `| קופה שבועית נטו | אחרי מס | **${ils(result.weeklyPrizeNet)}** |`,
        ]
      : [`| קופה שבועית לחלוקה | נטו | **${ils(result.weeklyPrizeNet)}** |`]),
    `| רווח מועדון (${config.clubProfitPct}% נטו) | חודשי | ${ils(result.clubProfitMonthly)} |`,
    "",
    "**חלוקה ל-5 זוכים בשבוע (יחסים קבועים באפליקציה — לא לשנות):**",
    "",
    "| מקום | אחוז | סכום |",
    "|------|------|------|",
  ];

  result.weeklyPlaces.forEach((amt, i) => {
    lines.push(
      `| ${WEEKLY_PLACE_LABELS[i]} | ${WEEKLY_PRIZE_RATIOS[i] * 100}% | **${ils(amt)}** |`
    );
  });

  lines.push(
    "",
    `_בדיקה: סכום 5 מקומות = ${ils(result.weeklyPlaces.reduce((a, b) => a + b, 0))} (שווה לקופה שבועית נטו)._`
  );

  return lines.join("\n");
}

export function formatPrizeCalculationsForUser(
  results: { title: string; result: PrizeCalculationResult }[],
  config: ResolvedPrizeConfig
): string {
  const header = [
    "## חישוב פרסים רשמי (מנוע CRM)",
    "",
    "המספרים למטה חושבו בקוד — **זהה ללוגיקת prize-pool באפליקציה**.",
    `מחיר מנוי: ${ils(config.monthlyPriceIls)} | תפעול: ${config.operationalCostPct}% (או בפועל אם רשום) | קרן פרסים: ${config.prizePoolPct}% נטו | מס במקור: ${config.withholdingTaxPct}%`,
    `מקור הגדרות: ${config.source === "ingestion" ? "prize_config ב-Supabase" : "ברירת מחדל"}`,
    "",
    "⚠️ תנאי זכאות (תקנון): premium פעיל, ≥7 חתימות מאומתות בחודש, מקום ב-5 הראשונים בניקוד שבועי.",
    "",
  ];

  const body = results
    .map(({ title, result }) => formatOneCalculation(result, config, title))
    .join("\n\n");

  return header.join("\n") + body;
}

export async function buildDeterministicPrizeContext(
  userInput: string,
  livePremiumCount: number
): Promise<{ block: string; isPrimaryAnswer: boolean; counts: number[] }> {
  const { fetchResolvedPrizeConfig } = await import("./prize-config");
  const config = await fetchResolvedPrizeConfig();

  const counts = extractSubscriberCounts(userInput);
  const prizeQ = isPrizeMoneyQuestion(userInput);

  if (!prizeQ) {
    return { block: "", isPrimaryAnswer: false, counts: [] };
  }

  const scenarios: number[] =
    counts.length > 0 ? counts : livePremiumCount > 0 ? [livePremiumCount] : [];

  if (scenarios.length === 0) {
    return {
      block:
        "## חישוב פרסים\nלא זוהה מספר מנויים בשאלה. ציין מספר (למשל 100) או הפעל סנכרון לנתוני premium בפועל.",
      isPrimaryAnswer: false,
      counts: [],
    };
  }

  const results = scenarios.map((n) => ({
    title:
      counts.length > 0 && n !== livePremiumCount
        ? `תרחיש: ${n.toLocaleString("he-IL")} מנויי premium (היפותטי)`
        : `מצב: ${n.toLocaleString("he-IL")} מנויי premium${n === livePremiumCount ? " (במראה CRM)" : ""}`,
    result: computePrizeCalculation(n, config, {
      hypothetical: counts.length > 0 && n !== livePremiumCount,
    }),
  }));

  const block = formatPrizeCalculationsForUser(results, config);

  return {
    block,
    isPrimaryAnswer: true,
    counts: scenarios,
  };
}
