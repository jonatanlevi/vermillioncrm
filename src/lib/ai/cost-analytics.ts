/**
 * ניתוח עלויות AI — מספרים מ-Prisma בלבד (לא LLM).
 */
import { db } from "@/lib/db";
import { AGENT_META, type AgentId } from "@/lib/types/agents";
import { formatUsdIls } from "./cost";
import {
  getAgentCostSummaries,
  getAppCostSummaries,
  getRecentAgentRuns,
  getTotalAiCost,
  type AgentCostSummary,
  type AgentRunListItem,
} from "./operations-queries";

const ILS_PER_USD = 3.7;
const KNOWN_AGENTS = Object.keys(AGENT_META) as AgentId[];

export type AiCostSnapshot = {
  generatedAt: string;
  monthKey: string;
  total: Awaited<ReturnType<typeof getTotalAiCost>>;
  byAgent: AgentCostSummary[];
  recentRuns: AgentRunListItem[];
  appByCategory: Awaited<ReturnType<typeof getAppCostSummaries>>;
  monthStats: {
    runsThisMonth: number;
    costUsdThisMonth: number;
    avgCostUsdPerRun: number;
    projectedMonthlyUsd: number;
    projectedMonthlyIls: number;
  };
  topExpensiveRuns: AgentRunListItem[];
  vermillionVsRest: {
    vermillionUsd: number;
    otherCrmUsd: number;
    vermillionSharePct: number;
  };
};

function monthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function buildAiCostSnapshot(): Promise<AiCostSnapshot> {
  const mk = new Date().toISOString().slice(0, 7);
  const start = monthStart();

  const [total, byAgent, recentRuns, appByCategory, monthRuns] = await Promise.all([
    getTotalAiCost(),
    getAgentCostSummaries(),
    getRecentAgentRuns(80),
    getAppCostSummaries(),
    db.agentRun.findMany({
      where: { startedAt: { gte: start } },
      select: { costUsd: true, startedAt: true },
    }),
  ]);

  const costUsdThisMonth = monthRuns.reduce((s, r) => s + r.costUsd, 0);
  const runsThisMonth = monthRuns.length;
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();
  const projectedMonthlyUsd =
    dayOfMonth > 0 ? (costUsdThisMonth / dayOfMonth) * daysInMonth : costUsdThisMonth;

  const topExpensiveRuns = [...recentRuns]
    .sort((a, b) => b.costUsd - a.costUsd)
    .slice(0, 8);

  const vermillionUsd =
    byAgent.find((a) => a.agentId === "vermillion")?.costUsd ?? 0;
  const otherCrmUsd = byAgent
    .filter((a) => a.agentId !== "vermillion")
    .reduce((s, a) => s + a.costUsd, 0);
  const totalCrmUsd = vermillionUsd + otherCrmUsd;
  const vermillionSharePct =
    totalCrmUsd > 0 ? Math.round((vermillionUsd / totalCrmUsd) * 100) : 0;

  return {
    generatedAt: new Date().toISOString(),
    monthKey: mk,
    total,
    byAgent,
    recentRuns: recentRuns.slice(0, 30),
    appByCategory,
    monthStats: {
      runsThisMonth,
      costUsdThisMonth,
      avgCostUsdPerRun: runsThisMonth > 0 ? costUsdThisMonth / runsThisMonth : 0,
      projectedMonthlyUsd: projectedMonthlyUsd,
      projectedMonthlyIls: projectedMonthlyUsd * ILS_PER_USD,
    },
    topExpensiveRuns,
    vermillionVsRest: { vermillionUsd, otherCrmUsd, vermillionSharePct },
  };
}

function ils(n: number): string {
  return `₪${n.toFixed(2)}`;
}

export function buildDeterministicCostRecommendations(s: AiCostSnapshot): string {
  const lines: string[] = [
    "## דוח עלויות AI רשמי (מנוע CRM — לא לחשב מחדש)",
    "",
    `עודכן: ${new Date(s.generatedAt).toLocaleString("he-IL")} | חודש ${s.monthKey}`,
    "",
    "### סיכום",
    "",
    "| מקור | ערך |",
    "|------|-----|",
    `| סה״כ AI (CRM + אפליקציה) | **${ils(s.total.totalCostIls)}** |`,
    `| CRM Agents (${s.total.crmRunCount} ריצות) | ${s.total.crmCostLabel} |`,
    `| אפליקציה — AI Coach (${s.total.appCostCount} רשומות) | ${ils(s.total.appCostIls)} |`,
    `| ריצות CRM החודש | ${s.monthStats.runsThisMonth} |`,
    `| עלות CRM החודש | ${formatUsdIls(s.monthStats.costUsdThisMonth)} |`,
    `| ממוצע לריצה | ${formatUsdIls(s.monthStats.avgCostUsdPerRun)} |`,
    `| **תחזית חודש מלא** (לפי קצב עד היום) | **${formatUsdIls(s.monthStats.projectedMonthlyUsd)}** (≈${ils(s.monthStats.projectedMonthlyIls)}) |`,
    "",
    "### עלות לפי סוכן CRM",
    "",
    "| סוכן | ריצות | עלות |",
    "|------|-------|------|",
  ];

  for (const a of s.byAgent) {
    lines.push(`| ${a.agentTitle} | ${a.runCount} | ${a.costLabel} |`);
  }
  if (s.byAgent.length === 0) {
    lines.push("| — | 0 | אין ריצות |");
  }

  lines.push(
    "",
    `**מוצר VerMillion** = ${formatUsdIls(s.vermillionVsRest.vermillionUsd)} (${s.vermillionVsRest.vermillionSharePct}% מעלות CRM Agents).`,
    "",
    "### ריצות יקרות ביותר (לפי תיעוד)",
    ""
  );

  if (s.topExpensiveRuns.length === 0) {
    lines.push("_אין ריצות מתועדות._");
  } else {
    lines.push("| זמן | סוכן | מודל | עלות | שלבים |");
    lines.push("|-----|------|------|------|-------|");
    for (const r of s.topExpensiveRuns) {
      lines.push(
        `| ${new Date(r.startedAt).toLocaleString("he-IL")} | ${r.agentTitle} | ${r.provider}${r.model ? ` · ${r.model}` : ""} | ${r.costLabel} | ${r.stepCount} |`
      );
    }
  }

  if (s.appByCategory.length > 0) {
    lines.push("", "### אפליקציה — לפי קטגוריה (החודש)", "");
    for (const c of s.appByCategory) {
      lines.push(`- **${c.category}**: ${c.count} רשומות, ${ils(c.totalIls)}`);
    }
  } else {
    lines.push(
      "",
      "### אפליקציה",
      "אין עדיין עלויות מסונכרנות מ-Supabase — הפעל «סנכרן נתונים» בלוח VerMillion.",
      ""
    );
  }

  const recs: string[] = [];

  if (s.vermillionVsRest.vermillionSharePct >= 50 && s.vermillionVsRest.vermillionUsd > 0.01) {
    recs.push(
      "סוכן **מוצר VerMillion** צורך את רוב עלות ה-CRM — הגבל הרצות אוטומטיות; העדף שאלות ממוקדות; בדוק ב«פירוט» אם יש שלבי LLM מיותרים."
    );
  }

  const heavy = s.byAgent.filter((a) => a.runCount >= 10 && a.costUsd > 0.01);
  if (heavy.length > 0) {
    recs.push(
      `סוכנים עם הרבה ריצות: ${heavy.map((a) => a.agentTitle).join(", ")} — שקול תבנית שאלה קבועה במקום ניסוי חוזר.`
    );
  }

  if (s.total.appCostIls === 0 && s.total.appCostCount === 0) {
    recs.push(
      "חבר עלויות **AI Coach באפליקציה** ל-CRM (סנכרון operational_costs) כדי לראות השפעה אמיתית על קופת הפרסים."
    );
  } else if (s.total.appCostIls > s.total.totalCostIls * 0.5) {
    recs.push(
      "עלות האפליקציה (Groq) גבוהה יחסית ל-CRM — בדוק מכסת שיחות ליום למשתמש, אורך פרומпт, ובחירת מודל באפליקציה."
    );
  }

  recs.push(
    "לחיסכון ב-CRM: השתמש ב-Groq למשימות טקסט (זול מ-Claude); הימנע מ-«בצע ברצף מלא» אם לא חייב; כבה ריצות אוטונומיות מיותרות."
  );
  recs.push(
    "לשליטה: עקוב אחרי «תחזית חודש מלא» למעלה; הגדר תקרה פנימית (למשל ₪500/חודש) ועצור אוטומציה מעליה."
  );
  recs.push(
    "עלויות AI מנוכות מקופת הפרסים — כל ₪1 שנחסך כאן מגדיל את הנטו לזוכים (ראה מדיניות פרסים)."
  );

  lines.push("", "### המלצות שליטה (מנוע — לא AI)", "");
  recs.forEach((r, i) => lines.push(`${i + 1}. ${r}`));

  lines.push(
    "",
    "_מספרים למעלה נשאבו מ-AgentRun + operational_costs. בשאלתך — השתמש רק בטבלאות אלה._"
  );

  return lines.join("\n");
}

export function formatAiCostSnapshotJson(s: AiCostSnapshot): string {
  return JSON.stringify(s, null, 2);
}
