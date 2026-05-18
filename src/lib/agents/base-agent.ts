import { completeTracked } from "@/lib/ai/complete";
import type { AgentContext, AgentId, AgentResult } from "@/lib/types/agents";
import { getAgentRunContext } from "@/lib/ai/run-context";
import { logAgentStep } from "@/lib/ai/audit";

export abstract class BaseAgent {
  abstract readonly id: AgentId;
  abstract readonly systemPrompt: string;

  protected async think(userInput: string, extraContext?: string): Promise<string> {
    const rationale = extraContext
      ? "שליחת בקשת המשתמש + הקשר עסקי למודל השפה לניתוח והמלצות."
      : "שליחת בקשת המשתמש למודל השפה לעיבוד לפי הנחיות הסוכן.";

    return completeTracked(
      [
        { role: "system", content: this.systemPrompt },
        {
          role: "user",
          content: extraContext
            ? `${userInput}\n\n---\nContext:\n${extraContext}`
            : userInput,
        },
      ],
      { temperature: 0.6 },
      { title: "ניתוח והפקת תשובה (LLM)", rationale }
    );
  }

  protected async logStep(
    kind: string,
    title: string,
    rationale: string,
    extra?: { inputPreview?: string; outputPreview?: string; status?: string }
  ) {
    const ctx = getAgentRunContext();
    if (!ctx) return;
    await logAgentStep({
      runId: ctx.runId,
      kind,
      title,
      rationale,
      ...extra,
    });
  }

  abstract run(ctx: AgentContext): Promise<AgentResult>;
}
