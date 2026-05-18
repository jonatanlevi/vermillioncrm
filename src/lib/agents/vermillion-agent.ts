import { db } from "@/lib/db";
import {
  getVermillionAnalyticsSnapshot,
  getVermillionDashboard,
} from "@/lib/vermillion/queries";
import { hasLocalAppData, isIngestionConfigured } from "@/lib/vermillion/status";
import type { AgentContext, AgentResult } from "@/lib/types/agents";
import { BaseAgent } from "./base-agent";

export class VermillionAgent extends BaseAgent {
  readonly id = "vermillion" as const;
  readonly systemPrompt = `You are VerMillion Data Analytics Agent for an Israeli fintech/gaming CRM.
You analyze mirrored app data (local CRM copy): users, premium subscriptions, DNA timer,
daily stamps, streaks, onboarding, AI chat usage, prize pool economics.
Respond in Hebrew with: executive summary, key insights, risks, 3-5 actionable recommendations.
Use numbers from the data. Be specific.`;

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

    const raw = await this.think(ctx.input, snapshot);

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
