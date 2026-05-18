import { db } from "@/lib/db";
import { generateImageTracked } from "@/lib/ai/complete";
import type { AgentContext, AgentResult } from "@/lib/types/agents";
import { BaseAgent } from "./base-agent";

export class MediaAgent extends BaseAgent {
  readonly id = "media" as const;
  readonly systemPrompt = `You are VerMillion CRM Media Agent.
Create image/video prompts for Israeli business marketing. Hebrew brand tone.
Output JSON: { type: "IMAGE"|"VIDEO", prompt, caption }.`;

  async run(ctx: AgentContext): Promise<AgentResult> {
    const raw = await this.think(ctx.input);
    let prompt = ctx.input;
    let type: "IMAGE" | "VIDEO" = "IMAGE";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]) as {
          type?: string;
          prompt?: string;
          caption?: string;
        };
        prompt = data.prompt ?? prompt;
        type = data.type === "VIDEO" ? "VIDEO" : "IMAGE";
      } catch {
        /* use defaults */
      }
    }

    const asset = await db.mediaAsset.create({
      data: { type, prompt, status: "GENERATING" },
    });

    try {
      let url: string | null = null;

      if (type === "IMAGE") {
        await this.logStep(
          "PREP",
          "הכנת פרומפט מדיה",
          "פירוק תשובת ה-LLM לפרומפט ייצוג ויזואלי.",
          { outputPreview: prompt.slice(0, 300) }
        );
        const result = await generateImageTracked(
          { prompt },
          {
            title: "יצירת תמונה (API)",
            rationale: "קריאה ל-API ייצור תמונה לפי הפרומפט שאושר בשלב הקודם.",
          }
        );
        url = result.url;
      }

      await db.mediaAsset.update({
        where: { id: asset.id },
        data: {
          status: url ? "READY" : "PENDING",
          url,
          metadata: JSON.stringify({ caption: raw.slice(0, 300) }),
        },
      });

      return {
        agentId: this.id,
        success: true,
        message: url
          ? "נוצר נכס מדיה (תמונה)"
          : "נשמר פרומפט מדיה — חיבור ייצור וידאו בהמשך",
        data: { mediaAssetId: asset.id, url },
        nextJobs: url
          ? [{ type: "campaign.attach_media", payload: { mediaAssetId: asset.id } }]
          : [],
      };
    } catch (e) {
      await db.mediaAsset.update({
        where: { id: asset.id },
        data: { status: "FAILED", metadata: JSON.stringify({ error: String(e) }) },
      });
      return {
        agentId: this.id,
        success: false,
        message: `ייצור מדיה נכשל: ${e instanceof Error ? e.message : "unknown"}`,
      };
    }
  }
}
