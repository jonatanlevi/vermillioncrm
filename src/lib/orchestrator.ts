import { db } from "@/lib/db";
import { getAgent } from "@/lib/agents";
import { getAIProvider } from "@/lib/ai";
import type { AgentContext, AgentId, AutomationJobSpec } from "@/lib/types/agents";
import { processJobQueue } from "@/lib/jobs/processor";

export interface RunAgentOptions {
  agentId: AgentId;
  input: string;
  metadata?: Record<string, unknown>;
  chainJobs?: boolean;
}

export async function runAgent(options: RunAgentOptions) {
  const { agentId, input, metadata, chainJobs = true } = options;
  const provider = getAIProvider();

  const run = await db.agentRun.create({
    data: {
      agentId,
      input,
      status: "RUNNING",
      provider: provider.name,
    },
  });

  try {
    const agent = getAgent(agentId);
    const ctx: AgentContext = { agentId, input, metadata };
    const result = await agent.run(ctx);

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

  const ai = getAIProvider();
  const route = (await ai.complete([
    { role: "user", content: routerPrompt },
  ])).trim().toLowerCase() as AgentId;

  const valid: AgentId[] = [
    "campaigns",
    "finance",
    "whatsapp",
    "sales",
    "media",
    "vermillion",
  ];
  const agentId = valid.includes(route) ? route : "sales";

  return runAgent({ agentId, input: instruction, chainJobs: true });
}
