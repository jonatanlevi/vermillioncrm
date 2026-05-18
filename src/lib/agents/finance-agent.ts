import { db } from "@/lib/db";
import type { AgentContext, AgentResult } from "@/lib/types/agents";
import { BaseAgent } from "./base-agent";

export class FinanceAgent extends BaseAgent {
  readonly id = "finance" as const;
  readonly systemPrompt = `You are VerMillion CRM Finance Agent.
Help with invoices and income/expense tracking for Israeli businesses.
When asked to create invoice, output JSON: { customerName, amount, currency, description }.
When asked to log transaction, output JSON: { type: "INCOME"|"EXPENSE", category, amount, description }.`;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const raw = await this.think(ctx.input);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return {
        agentId: this.id,
        success: true,
        message: raw.slice(0, 500),
        data: { advisory: raw },
      };
    }

    try {
      const data = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

      if (data.type === "INCOME" || data.type === "EXPENSE") {
        const tx = await db.transaction.create({
          data: {
            type: data.type as "INCOME" | "EXPENSE",
            category: String(data.category ?? "כללי"),
            amount: Number(data.amount ?? 0),
            currency: String(data.currency ?? "ILS"),
            description: data.description ? String(data.description) : null,
          },
        });
        return {
          agentId: this.id,
          success: true,
          message: `נרשמה ${data.type === "INCOME" ? "הכנסה" : "הוצאה"}: ₪${tx.amount}`,
          data: { transactionId: tx.id },
        };
      }

      const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
      const invoice = await db.invoice.create({
        data: {
          number: invoiceNumber,
          amount: Number(data.amount ?? 0),
          currency: String(data.currency ?? "ILS"),
          status: "DRAFT",
        },
      });

      return {
        agentId: this.id,
        success: true,
        message: `נוצרה חשבונית ${invoice.number} בסכום ₪${invoice.amount}`,
        data: { invoiceId: invoice.id },
      };
    } catch {
      return { agentId: this.id, success: false, message: "שגיאה בעיבוד פעולה פיננסית" };
    }
  }
}
