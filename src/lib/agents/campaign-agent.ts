import { db } from "@/lib/db";
import { getNetwork } from "@/lib/social/networks";
import type { AgentContext, AgentResult } from "@/lib/types/agents";
import { BaseAgent } from "./base-agent";

export class CampaignAgent extends BaseAgent {
  readonly id = "campaigns" as const;
  readonly systemPrompt = `You are VerMillion CRM Campaign Agent.
Create social media campaign plans for Israeli businesses.
Output JSON only with: name, objective, networks (array), posts (array of {network, content, scheduledHint}).
Language: Hebrew for content, English for keys.`;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const targetNetwork = ctx.metadata?.network as string | undefined;
    const networkConfig = targetNetwork ? getNetwork(targetNetwork) : undefined;

    const networkHint = networkConfig
      ? `Target ONLY network: ${networkConfig.id} (${networkConfig.nameHe}). Formats: ${networkConfig.formatHints.join(", ")}.`
      : "";

    const raw = await this.think(
      ctx.input,
      networkHint || undefined
    );
    let parsed: {
      name?: string;
      objective?: string;
      networks?: string[];
      posts?: { network: string; content: string; scheduledHint?: string }[];
    };

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? raw);
    } catch {
      return {
        agentId: this.id,
        success: false,
        message: "לא הצלחתי לפרסר תוכנית קמפיין מה-AI",
        data: { raw },
      };
    }

    const networks = targetNetwork
      ? [targetNetwork]
      : (parsed.networks ?? []).filter(Boolean);

    const posts = (parsed.posts ?? []).filter((p) =>
      targetNetwork ? p.network === targetNetwork : true
    );

    const campaign = await db.campaign.create({
      data: {
        name:
          parsed.name ??
          (networkConfig ? `קמפיין ${networkConfig.nameHe}` : "קמפיין חדש"),
        objective: parsed.objective,
        status: "DRAFT",
        networks: JSON.stringify(
          networks.length ? networks : posts.map((p) => p.network)
        ),
      },
    });

    for (const p of posts) {
      await db.socialPost.create({
        data: {
          campaignId: campaign.id,
          network: targetNetwork ?? p.network,
          content: p.content,
          status: "DRAFT",
        },
      });
    }

    const label = networkConfig?.nameHe ?? "כל הרשתות";

    return {
      agentId: this.id,
      success: true,
      message: `נוצר קמפיין "${campaign.name}" ל-${label} עם ${posts.length} פוסטים`,
      data: { campaignId: campaign.id, networks, network: targetNetwork },
      nextJobs: posts.map((p) => ({
        type: "media.generate",
        payload: { campaignId: campaign.id, network: p.network, prompt: p.content },
      })),
    };
  }
}
