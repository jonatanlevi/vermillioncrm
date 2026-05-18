import { db } from "@/lib/db";
import type { AgentContext, AgentResult } from "@/lib/types/agents";
import { BaseAgent } from "./base-agent";

export class SalesAgent extends BaseAgent {
  readonly id = "sales" as const;
  readonly systemPrompt = `You are VerMillion CRM Sales & Operations Agent.
Track leads, sales pipeline, and business operations.
For new lead/sale output JSON: { title, amount, status: "LEAD"|"QUALIFIED"|"PROPOSAL"|"WON"|"LOST", customerName? }.
Provide pipeline summary when asked.`;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const stats = await db.sale.groupBy({
      by: ["status"],
      _count: true,
      _sum: { amount: true },
    });

    const raw = await this.think(
      ctx.input,
      `Current pipeline: ${JSON.stringify(stats)}`
    );

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch && jsonMatch[0].includes("title")) {
      try {
        const data = JSON.parse(jsonMatch[0]) as {
          title: string;
          amount: number;
          status?: string;
          customerName?: string;
        };

        let customerId: string | undefined;
        if (data.customerName) {
          const c = await db.customer.create({
            data: { name: data.customerName },
          });
          customerId = c.id;
        }

        const sale = await db.sale.create({
          data: {
            title: data.title,
            amount: Number(data.amount ?? 0),
            status:
              (data.status as "LEAD" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST") ??
              "LEAD",
            customerId,
          },
        });

        return {
          agentId: this.id,
          success: true,
          message: `נוספה עסקה: ${sale.title}`,
          data: { saleId: sale.id },
        };
      } catch {
        /* advisory only */
      }
    }

    return {
      agentId: this.id,
      success: true,
      message: raw.slice(0, 800),
      data: { pipeline: stats },
    };
  }
}
