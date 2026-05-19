/**
 * פרמטרי prize_config — זהה ל-api/prize-pool.js ול-sync.ts
 */
import { getIngestionClient, isIngestionSourceConfigured } from "@/lib/ingestion/app-source";

export type ResolvedPrizeConfig = {
  monthlyPriceIls: number;
  operationalCostPct: number;
  prizePoolPct: number;
  clubProfitPct: number;
  withholdingTaxPct: number;
  /** סכום תפעול בפועל לחודש נוכחי (אם רשום ב-Supabase) */
  actualOperationalCostsThisMonth: number;
  source: "ingestion" | "defaults";
};

const DEFAULTS: ResolvedPrizeConfig = {
  monthlyPriceIls: 99,
  operationalCostPct: 20,
  prizePoolPct: 50,
  clubProfitPct: 50,
  withholdingTaxPct: 0,
  actualOperationalCostsThisMonth: 0,
  source: "defaults",
};

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

export async function fetchResolvedPrizeConfig(): Promise<ResolvedPrizeConfig> {
  if (!isIngestionSourceConfigured()) return { ...DEFAULTS };

  const sb = getIngestionClient();
  if (!sb) return { ...DEFAULTS };

  const month = monthKey();
  const [cfgRes, costsRes] = await Promise.all([
    sb.from("prize_config").select("*").eq("id", 1).maybeSingle(),
    sb.from("operational_costs").select("amount_ils").eq("month", month),
  ]);

  const cfg = cfgRes.data as Record<string, unknown> | null;
  const costs = costsRes.data ?? [];
  const actualOperationalCostsThisMonth = costs.reduce(
    (s, r: { amount_ils?: number }) => s + Number(r.amount_ils || 0),
    0
  );

  return {
    monthlyPriceIls: Number(cfg?.monthly_price_ils ?? DEFAULTS.monthlyPriceIls),
    operationalCostPct: Number(cfg?.operational_cost_pct ?? DEFAULTS.operationalCostPct),
    prizePoolPct: Number(cfg?.prize_pool_pct ?? DEFAULTS.prizePoolPct),
    clubProfitPct: Number(cfg?.company_profit_pct ?? DEFAULTS.clubProfitPct),
    withholdingTaxPct: Number(cfg?.withholding_tax_pct ?? DEFAULTS.withholdingTaxPct),
    actualOperationalCostsThisMonth,
    source: cfg ? "ingestion" : "defaults",
  };
}
