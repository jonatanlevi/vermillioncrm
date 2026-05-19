/**
 * מנגנון פרסים — מקור: PRODUCT_SPEC.html + LeaderboardScreen.js + api/prize-pool.js
 * עדכון ידני אם האפיון משתנה.
 */

/** חלוקת קופה שבועית בין 5 מקומות (כמו באפליקציה — לא מוצג למשתמש ב-UI) */
export const WEEKLY_PRIZE_RATIOS = [0.35, 0.25, 0.2, 0.12, 0.08] as const;

export const WEEKLY_PLACE_LABELS = [
  "מקום 1",
  "מקום 2",
  "מקום 3",
  "מקום 4",
  "מקום 5",
] as const;

/** טבלת אפיון מוצר — דוגמאות לפי גודל קהילה (PRODUCT_SPEC.html §4) */
export const PRODUCT_SPEC_PRIZE_TABLE = [
  { users: 50, weeklyFund: 550, places: [193, 138, 110, 66, 44] },
  { users: 200, weeklyFund: 2350, places: [822, 588, 470, 282, 188] },
  { users: 500, weeklyFund: 5938, places: [2078, 1485, 1188, 713, 475] },
  { users: 1000, weeklyFund: 11938, places: [4178, 2985, 2388, 1433, 955] },
  { users: 5000, weeklyFund: 60000, places: [21000, 15000, 12000, 7200, 4800] },
] as const;

export const PRIZE_BUSINESS_MODEL = {
  monthlyPriceIls: 99,
  operationalCostPerUserIls: 5,
  operationalCostPctFallback: 20,
  prizePoolPctOfNet: 50,
  clubProfitPctOfNet: 50,
  weeksPerMonth: 4,
  winnersPerWeek: 5,
  minStampsPerMonthForEligibility: 7,
  withholdingTaxPctDefault: 0,
} as const;

export type PrizePoolInputs = {
  activeSubscribers: number;
  monthlyPriceIls?: number;
  operationalCostsIls?: number;
  operationalCostPct?: number;
  prizePoolPct?: number;
  withholdingTaxPct?: number;
};

/** חישוב כמו api/prize-pool.js + sync.ts computePrizePoolFromSource */
export function computePrizePoolFromInputs(input: PrizePoolInputs) {
  const monthlyPrice = input.monthlyPriceIls ?? PRIZE_BUSINESS_MODEL.monthlyPriceIls;
  const prizePoolPct = input.prizePoolPct ?? PRIZE_BUSINESS_MODEL.prizePoolPctOfNet;
  const withholdingTaxPct =
    input.withholdingTaxPct ?? PRIZE_BUSINESS_MODEL.withholdingTaxPctDefault;

  const monthlyRevenue = input.activeSubscribers * monthlyPrice;

  let operationalCosts: number;
  if (input.operationalCostsIls != null && input.operationalCostsIls > 0) {
    operationalCosts = input.operationalCostsIls;
  } else {
    const pct = input.operationalCostPct ?? PRIZE_BUSINESS_MODEL.operationalCostPctFallback;
    operationalCosts = monthlyRevenue * (pct / 100);
  }

  const netRevenue = Math.max(0, monthlyRevenue - operationalCosts);
  const monthlyPrizePool = netRevenue * (prizePoolPct / 100);
  const weeklyPrizePool = monthlyPrizePool / PRIZE_BUSINESS_MODEL.weeksPerMonth;
  const weeklyPrizeNet = weeklyPrizePool * (1 - withholdingTaxPct / 100);
  const clubProfit = netRevenue * (PRIZE_BUSINESS_MODEL.clubProfitPctOfNet / 100);

  const weeklyPlaces = distributeWeeklyPrizes(Math.round(weeklyPrizeNet));

  return {
    monthlyRevenue: Math.round(monthlyRevenue),
    operationalCosts: Math.round(operationalCosts),
    netRevenue: Math.round(netRevenue),
    monthlyPrizePool: Math.round(monthlyPrizePool),
    weeklyPrizePool: Math.round(weeklyPrizePool),
    weeklyPrizeNet: Math.round(weeklyPrizeNet),
    clubProfitMonthly: Math.round(clubProfit),
    weeklyPlaces,
  };
}

export function distributeWeeklyPrizes(weeklyPoolNet: number): number[] {
  const amounts = WEEKLY_PRIZE_RATIOS.map((r) => Math.round(weeklyPoolNet * r));
  const sum = amounts.reduce((a, b) => a + b, 0);
  const drift = weeklyPoolNet - sum;
  if (drift !== 0 && amounts.length > 0) {
    amounts[0] += drift;
  }
  return amounts;
}

export function formatPrizeEconomicsForAI(
  live?: ReturnType<typeof computePrizePoolFromInputs> & { activeSubscribers: number }
): string {
  const lines = [
    "## מודל עסקי — קופת פרסים (מסמך אפיון PRODUCT_SPEC + קוד אפליקציה)",
    "",
    "זרימת כסף:",
    "1. הכנסה = מנויים premium פעילים × ₪99 (ברירת מחדל, ניתן לשינוי ב-prize_config)",
    "2. מינוס הוצאות תפעול (~₪5/משתמש במסמך אפיון, או % מההכנסות ב-prize_config — מה שגבוה/מדויק יותר בפועל)",
    "3. נטו = הכנסה − תפעול",
    "4. 50% מהנטו → קרן פרסים (מחולקת ל-4 שבועות)",
    "5. 50% מהנטו → רווח מועדון (צמיחה, פיתוח, שכר)",
    "",
    "זוכים: 5 מקומות כל שבוע. חלוקת הקופה השבועית (יחסים קבועים באפליקציה):",
    `מקום 1: ${WEEKLY_PRIZE_RATIOS[0] * 100}% | מקום 2: ${WEEKLY_PRIZE_RATIOS[1] * 100}% | מקום 3: ${WEEKLY_PRIZE_RATIOS[2] * 100}% | מקום 4: ${WEEKLY_PRIZE_RATIOS[3] * 100}% | מקום 5: ${WEEKLY_PRIZE_RATIOS[4] * 100}%`,
    "",
    "זכאות לפרס (תקנון): מנוי premium פעיל; לפחות 7 חתימות מאומתות בחודש; חתימות רק משרת (anti-cheat).",
    "שוויון ניקוד: קרוב יותר ל-DNA/יעד אתגר מנצח.",
    "",
    "טבלת אפיון — דוגמאות לפי גודל קהילה (הפרסים גדלים עם הקהילה — אינטרס viral):",
    "| משתמשים | קרן שבועית | מקום 1 | מקום 2 | מקום 3 | מקום 4 | מקום 5 |",
    "|---------|------------|--------|--------|--------|--------|--------|",
  ];

  for (const row of PRODUCT_SPEC_PRIZE_TABLE) {
    lines.push(
      `| ${row.users} | ₪${row.weeklyFund.toLocaleString("he-IL")} | ₪${row.places[0].toLocaleString("he-IL")} | ₪${row.places[1].toLocaleString("he-IL")} | ₪${row.places[2].toLocaleString("he-IL")} | ₪${row.places[3].toLocaleString("he-IL")} | ₪${row.places[4].toLocaleString("he-IL")} |`
    );
  }

  if (live && live.activeSubscribers > 0) {
    lines.push(
      "",
      `--- חישוב חי לפי ${live.activeSubscribers} מנויי premium במראה CRM ---`,
      `הכנסה חודשית משוערת: ₪${live.monthlyRevenue.toLocaleString("he-IL")}`,
      `תפעול: ₪${live.operationalCosts.toLocaleString("he-IL")} | נטו: ₪${live.netRevenue.toLocaleString("he-IL")}`,
      `קופה חודשית (50% נטו): ₪${live.monthlyPrizePool.toLocaleString("he-IL")} | שבועית ברוטו: ₪${live.weeklyPrizePool.toLocaleString("he-IL")} | שבועית נטו: ₪${live.weeklyPrizeNet.toLocaleString("he-IL")}`,
      `רווח מועדון (50% נטו/חודש): ₪${live.clubProfitMonthly.toLocaleString("he-IL")}`,
      "פרסים שבועיים מחושבים עכשיו:",
      ...live.weeklyPlaces.map(
        (amt, i) => `- ${WEEKLY_PLACE_LABELS[i]}: ₪${amt.toLocaleString("he-IL")} (${WEEKLY_PRIZE_RATIOS[i] * 100}%)`
      )
    );
  }

  lines.push(
    "",
    "הערה למנכ״ל: שורות הטבלה במסמך האפיון הן דוגמאות שיווקיות; המספרים האמיתיים רצים דינמית ממספר המנויים ב-prize-pool API."
  );

  return lines.join("\n");
}
