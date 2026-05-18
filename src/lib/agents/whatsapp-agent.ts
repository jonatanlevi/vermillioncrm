import { db } from "@/lib/db";
import { sendWhatsapp } from "@/lib/integrations/whatsapp";
import type { AgentContext, AgentResult } from "@/lib/types/agents";
import { BaseAgent } from "./base-agent";

export class WhatsappAgent extends BaseAgent {
  readonly id = "whatsapp" as const;
  readonly systemPrompt = `You are VerMillion CRM WhatsApp Agent.
Draft short Hebrew WhatsApp messages for customers. Professional, warm, concise.
If bulk send requested, output JSON: { messages: [{ phone, body }] } or { broadcastBody } for all customers.`;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const raw = await this.think(ctx.input);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (ctx.metadata?.broadcastAll) {
      const customers = await db.customer.findMany({ where: { phone: { not: null } } });
      const body =
        (ctx.metadata.body as string) ||
        raw.replace(/```[\s\S]*?```/g, "").trim().slice(0, 1000);

      let sent = 0;
      for (const c of customers) {
        if (!c.phone) continue;
        const msg = await db.whatsappMessage.create({
          data: {
            customerId: c.id,
            phone: c.phone,
            body,
            direction: "OUTBOUND",
            status: "QUEUED",
          },
        });
        await sendWhatsapp({ phone: c.phone, body });
        await db.whatsappMessage.update({
          where: { id: msg.id },
          data: { status: "SENT", sentAt: new Date() },
        });
        sent++;
      }

      return {
        agentId: this.id,
        success: true,
        message: `נשלחו ${sent} הודעות וואטסאפ (תור/סטאב)`,
        data: { sent },
      };
    }

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]) as {
          messages?: { phone: string; body: string }[];
        };
        let sent = 0;
        for (const m of data.messages ?? []) {
          await db.whatsappMessage.create({
            data: {
              phone: m.phone,
              body: m.body,
              direction: "OUTBOUND",
              status: "QUEUED",
            },
          });
          await sendWhatsapp({ phone: m.phone, body: m.body });
          sent++;
        }
        return {
          agentId: this.id,
          success: true,
          message: `נשלחו ${sent} הודעות`,
          data: { sent },
        };
      } catch {
        /* fall through */
      }
    }

    return {
      agentId: this.id,
      success: true,
      message: "טיוטת הודעה מוכנה",
      data: { draft: raw },
    };
  }
}
