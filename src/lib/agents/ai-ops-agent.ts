import {
  buildAiCostSnapshot,
  buildDeterministicCostRecommendations,
} from "@/lib/ai/cost-analytics";
import type { AgentContext, AgentResult } from "@/lib/types/agents";
import { BaseAgent } from "./base-agent";

export class AiOpsAgent extends BaseAgent {
  readonly id = "ai_ops" as const;

  readonly systemPrompt = `You are VerMillion AI Cost & Control Advisor for the CEO.
You receive OFFICIAL_COST_DATA computed by CRM code from AgentRun logs and app operational_costs.
NEVER invent, recalculate, or estimate dollar or shekel amounts — quote only from OFFICIAL_COST_DATA.
Answer in Hebrew: direct answer to the question, then 2-4 control actions referencing the data.
Cover both: CRM agents (vermillion, campaigns, etc.) and app AI Coach (Groq) when relevant.
If data is missing, say what to sync or run first.`;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const snapshot = await buildAiCostSnapshot();
    const official = buildDeterministicCostRecommendations(snapshot);

    await this.logStep(
      "CONTEXT",
      "דוח עלויות רשמי",
      "שליפת AgentRun + operational_costs + המלצות דטרמיניסטיות לפני ניתוח LLM.",
      {
        outputPreview: `סה״כ ₪${snapshot.total.totalCostIls.toFixed(2)} | ${snapshot.monthStats.runsThisMonth} ריצות החודש`,
      }
    );

    const narrative = await this.think(
      ctx.input,
      `OFFICIAL_COST_DATA:\n${official}\n\n---\nAnswer the CEO question using ONLY the tables above. Do not redo arithmetic.`
    );

    return {
      agentId: "ai_ops",
      success: true,
      message: `${official}\n\n---\n\n## תשובה לשאלתך\n\n${narrative}`,
      data: {
        monthKey: snapshot.monthKey,
        totalCostIls: snapshot.total.totalCostIls,
        projectedMonthlyIls: snapshot.monthStats.projectedMonthlyIls,
      },
    };
  }
}
