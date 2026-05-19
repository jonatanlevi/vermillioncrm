import { db } from "@/lib/db";
import {
  getVermillionAnalyticsSnapshot,
  getVermillionDashboard,
} from "@/lib/vermillion/queries";
import { hasLocalAppData, isIngestionConfigured } from "@/lib/vermillion/status";
import { augmentSystemPrompt, buildVermillionAgentContext } from "@/lib/product-knowledge";
import { buildDeterministicPrizeContext } from "@/lib/product-knowledge/prize-calculator";
import type { AgentContext, AgentResult } from "@/lib/types/agents";
import { BaseAgent } from "./base-agent";

export class VermillionAgent extends BaseAgent {
  readonly id = "vermillion" as const;

  /** ידע מלא ב-user context; ב-system רק תמצית */
  protected systemPromptWithProduct(): string {
    return augmentSystemPrompt(this.systemPrompt, "brief");
  }

  readonly systemPrompt = `You are VerMillion Data Analytics Agent inside the company CRM.
You MUST interpret user data using the VerMillion product knowledge (DNA, Friday/Saturday challenge,
game→token→stamp flow, premium vs free, prize pool rules, 31 games, onboarding days 1-7 and 9-30).
Never invent product rules — only use PRODUCT KNOWLEDGE + the data snapshot.
CRITICAL: Never calculate money (prizes, revenue, splits). If PRIZE_CALCULATION_OFFICIAL block exists, quote those numbers exactly.
Analyze: churn risk, fraud (token_used vs stamps), premium conversion, cohorts by lang.
Respond in Hebrew: executive summary, insights tied to product rules, risks, 3-5 CEO-level actions.
Use numbers from the snapshot and official prize blocks only.`;

  async run(ctx: AgentContext): Promise<AgentResult> {
    if (!isIngestionConfigured()) {
      return {
        agentId: this.id,
        success: false,
        message:
          "מקור יניקה לא מוגדר. הוסף VERMILLION_INGESTION_URL ו-VERMILLION_INGESTION_SERVICE_KEY ל-.env",
      };
    }

    if (!(await hasLocalAppData())) {
      return {
        agentId: this.id,
        success: false,
        message: "אין נתונים מקומיים. הפעל סנכרון ממרכז המוצר.",
      };
    }

    const snapshot = await getVermillionAnalyticsSnapshot();
    const dash = await getVermillionDashboard();

    const prizeCalc = await buildDeterministicPrizeContext(
      ctx.input,
      dash.totals.premium
    );

    if (prizeCalc.isPrimaryAnswer && prizeCalc.block) {
      await this.logStep(
        "CALC",
        "חישוב פרסים רשמי",
        "שאלת כסף/פרס — תשובה מהמנוע הדטרמיניסטי (prize-pool.js) בלי חשבון AI.",
        {
          outputPreview: `מנויים בתרחיש: ${prizeCalc.counts.join(", ")}`,
        }
      );

      return {
        agentId: this.id,
        success: true,
        message: prizeCalc.block,
        data: {
          month: dash.monthKey,
          deterministicPrize: true,
          subscriberScenarios: prizeCalc.counts,
        },
      };
    }

    const agentContext = [
      await buildVermillionAgentContext(snapshot),
      prizeCalc.block
        ? `\n\n---\nPRIZE_CALCULATION_OFFICIAL (אסור לחשב מחדש):\n${prizeCalc.block}`
        : "",
    ].join("");

    await this.logStep(
      "CONTEXT",
      "ידע מוצר + נתונים",
      "טעינת חוזה מוצר מלא (DNA, משחקים, תקנון, anti-cheat), קופת פרס חיה, וסנAPSHOT משתמשים מהמראה המקומית.",
      { outputPreview: `משתמשים: ${dash.totals.users}, פרימיום: ${dash.totals.premium}` }
    );

    for (const m of [
      { name: "total_users", value: dash.totals.users, unit: "users" },
      { name: "premium_users", value: dash.totals.premium, unit: "users" },
      { name: "timers_set", value: dash.totals.withTimerSet, unit: "users" },
      { name: "stamps_month", value: dash.totals.totalStampsThisMonth, unit: "stamps" },
      {
        name: "stamped_users_month",
        value: dash.totals.stampedUsersThisMonth,
        unit: "users",
      },
    ]) {
      await db.vermillionSnapshot.create({
        data: {
          metric: m.name,
          value: m.value,
          unit: m.unit,
          raw: JSON.stringify({ month: dash.monthKey }),
        },
      });
    }

    const raw = await this.think(ctx.input, agentContext);

    return {
      agentId: this.id,
      success: true,
      message: raw,
      data: {
        month: dash.monthKey,
        totals: dash.totals,
        configured: true,
      },
    };
  }
}
