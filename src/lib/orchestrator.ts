import { db } from "@/lib/db";
import { getAgent } from "@/lib/agents";
import { getAIProvider, resolveProviderName } from "@/lib/ai";
import { completeRaw } from "@/lib/ai/complete";
import { logAgentStep, logLlmStep } from "@/lib/ai/audit";
import { withAgentRun } from "@/lib/ai/run-context";
import type { AgentContext, AgentId, AutomationJobSpec } from "@/lib/types/agents";
import { processJobQueue } from "@/lib/jobs/processor";

export interface RunAgentOptions {
  agentId: AgentId;
  input: string;
  metadata?: Record<string, unknown>;
  chainJobs?: boolean;
  trigger?: "manual" | "autonomous" | "job";
}

export async function runAgent(options: RunAgentOptions) {
  const { agentId, input, metadata, chainJobs = true, trigger = "manual" } = options;
  const provider = getAIProvider();

  const run = await db.agentRun.create({
    data: {
      agentId,
      input,
      status: "RUNNING",
      provider: provider.name,
      trigger,
      metadata: JSON.stringify(metadata ?? {}),
    },
  });

  await logAgentStep({
    runId: run.id,
    kind: "START",
    title: "התחלת ריצת סוכן",
    rationale: `הפעלת סוכן ${agentId} (${trigger}). המערכת טוענת הקשר ומריצה את השלבים הרלוונטיים.`,
    inputPreview: input.slice(0, 500),
    provider: provider.name,
  });

  try {
    const result = await withAgentRun({ runId: run.id, agentId }, async () => {
      const agent = getAgent(agentId);
      const ctx: AgentContext = { agentId, input, metadata };
      return agent.run(ctx);
    });

    if (result.nextJobs?.length) {
      await logAgentStep({
        runId: run.id,
        kind: "JOB",
        title: "תזמון משימות המשך",
        rationale: `הסוכן החליט לשרשר ${result.nextJobs.length} משימות אוטומציה (מדיה, פרסום, וכו׳).`,
        outputPreview: JSON.stringify(result.nextJobs.map((j) => j.type)),
      });
    }

    await logAgentStep({
      runId: run.id,
      kind: "COMPLETE",
      title: result.success ? "ריצה הושלמה בהצלחה" : "ריצה נכשלה",
      rationale: result.success
        ? "כל שלבי הסוכן הסתיימו; התוצאה נשמרה."
        : `הסוכן דיווח על כשל: ${result.message}`,
      outputPreview: result.message.slice(0, 800),
      status: result.success ? "OK" : "FAILED",
    });

    await db.agentRun.update({
      where: { id: run.id },
      data: {
        status: result.success ? "COMPLETED" : "FAILED",
        output: JSON.stringify(result),
        finishedAt: new Date(),
        error: result.success ? null : result.message,
      },
    });

    if (chainJobs && result.nextJobs?.length) {
      await enqueueJobs(result.nextJobs);
      await processJobQueue();
    }

    return { runId: run.id, ...result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Agent run failed";
    await logAgentStep({
      runId: run.id,
      kind: "ERROR",
      title: "שגיאה לא צפויה",
      rationale: "חריגה במהלך הריצה — לא הושלם עיבוד מלא.",
      outputPreview: message,
      status: "FAILED",
    });
    await db.agentRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: message, finishedAt: new Date() },
    });
    throw e;
  }
}

export async function enqueueJobs(jobs: AutomationJobSpec[]) {
  for (const job of jobs) {
    const runAt = new Date(Date.now() + (job.delayMs ?? 0));
    await db.automationJob.create({
      data: {
        type: job.type,
        payload: JSON.stringify(job.payload),
        status: "QUEUED",
        runAt,
      },
    });
  }
}

/** Full-auto pipeline: one instruction → routes to agents → chains jobs */
export async function runAutonomousPipeline(instruction: string) {
  const routerPrompt = `Given this business instruction, which agent should handle it first?
Agents: campaigns, finance, whatsapp, sales, media, vermillion.
Reply with ONE word only (the agent id). Instruction: ${instruction}`;

  const providerName = resolveProviderName();
  if (providerName === "none") {
    throw new Error("AI לא מוגדר — הוסף XAI_API_KEY או ANTHROPIC_API_KEY ל-.env");
  }
  const routeRun = await db.agentRun.create({
    data: {
      agentId: "router",
      input: instruction,
      status: "RUNNING",
      provider: providerName,
      trigger: "autonomous",
    },
  });

  await logAgentStep({
    runId: routeRun.id,
    kind: "START",
    title: "התחלת ניתוב אוטונומי",
    rationale:
      "מנוע האוטונומיה מפרש את הוראת המנכ״ל ובוחר איזה סוכן יטפל ראשון.",
    inputPreview: instruction.slice(0, 500),
    provider: providerName,
  });

  const routeResult = await completeRaw([{ role: "user", content: routerPrompt }]);
  await logLlmStep(
    routeRun.id,
    {
      title: "בחירת סוכן (Router LLM)",
      rationale:
        "שליחת ההוראה למודל עם רשימת הסוכנים — התשובה היא מזהה סוכן יחיד.",
      inputPreview: routerPrompt,
    },
    providerName,
    routeResult
  );

  const route = routeResult.text.trim().toLowerCase() as AgentId;
  const valid: AgentId[] = [
    "campaigns",
    "finance",
    "whatsapp",
    "sales",
    "media",
    "vermillion",
  ];
  const agentId = valid.includes(route) ? route : "sales";

  await logAgentStep({
    runId: routeRun.id,
    kind: "ROUTE",
    title: `נותב לסוכן: ${agentId}`,
    rationale: valid.includes(route)
      ? `המודל בחר במפורש את הסוכן «${agentId}».`
      : `תשובת המודל («${routeResult.text.slice(0, 40)}») לא זוהתה — ברירת מחדל: sales.`,
    outputPreview: agentId,
  });

  await db.agentRun.update({
    where: { id: routeRun.id },
    data: { status: "COMPLETED", output: JSON.stringify({ agentId }), finishedAt: new Date() },
  });

  return runAgent({ agentId, input: instruction, chainJobs: true, trigger: "autonomous" });
}
