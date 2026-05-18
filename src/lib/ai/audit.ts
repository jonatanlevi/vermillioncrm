import { db } from "@/lib/db";
import { estimateImageCostUsd, estimateLlmCostUsd } from "./cost";
import type { AIProviderName, CompletionResult, ImageResult } from "./types";

function preview(text: string, max = 600): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

async function nextStepIndex(runId: string): Promise<number> {
  const last = await db.agentRunStep.findFirst({
    where: { runId },
    orderBy: { stepIndex: "desc" },
    select: { stepIndex: true },
  });
  return (last?.stepIndex ?? -1) + 1;
}

export async function addRunUsage(
  runId: string,
  usage: { inputTokens: number; outputTokens: number; costUsd: number; model?: string }
) {
  const run = await db.agentRun.update({
    where: { id: runId },
    data: {
      inputTokens: { increment: usage.inputTokens },
      outputTokens: { increment: usage.outputTokens },
      costUsd: { increment: usage.costUsd },
      ...(usage.model ? { model: usage.model } : {}),
    },
  });
  return run;
}

export type LogStepInput = {
  runId: string;
  kind: string;
  title: string;
  rationale: string;
  inputPreview?: string;
  outputPreview?: string;
  provider?: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  status?: string;
};

export async function logAgentStep(input: LogStepInput) {
  const stepIndex = await nextStepIndex(input.runId);
  const costUsd = input.costUsd ?? 0;
  const inputTokens = input.inputTokens ?? 0;
  const outputTokens = input.outputTokens ?? 0;

  await db.agentRunStep.create({
    data: {
      runId: input.runId,
      stepIndex,
      kind: input.kind,
      title: input.title,
      rationale: input.rationale,
      inputPreview: input.inputPreview,
      outputPreview: input.outputPreview,
      provider: input.provider,
      model: input.model,
      inputTokens,
      outputTokens,
      costUsd,
      status: input.status ?? "OK",
      finishedAt: new Date(),
    },
  });

  if (costUsd > 0 || inputTokens > 0 || outputTokens > 0) {
    await addRunUsage(input.runId, {
      inputTokens,
      outputTokens,
      costUsd,
      model: input.model,
    });
  }
}

export async function logLlmStep(
  runId: string,
  meta: { title: string; rationale: string; inputPreview?: string },
  provider: AIProviderName,
  result: CompletionResult
) {
  const costUsd = estimateLlmCostUsd(
    provider,
    result.model,
    result.usage.inputTokens,
    result.usage.outputTokens
  );
  await logAgentStep({
    runId,
    kind: "LLM",
    title: meta.title,
    rationale: meta.rationale,
    inputPreview: meta.inputPreview ? preview(meta.inputPreview) : undefined,
    outputPreview: preview(result.text),
    provider,
    model: result.model,
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    costUsd,
  });
}

export async function logImageStep(
  runId: string,
  meta: { title: string; rationale: string; prompt: string },
  provider: AIProviderName,
  result: ImageResult
) {
  const costUsd = result.costUsd || estimateImageCostUsd(provider, result.model);
  await logAgentStep({
    runId,
    kind: "IMAGE",
    title: meta.title,
    rationale: meta.rationale,
    inputPreview: preview(meta.prompt, 400),
    outputPreview: result.url,
    provider,
    model: result.model,
    costUsd,
  });
}
