import { db } from "@/lib/db";
import { AGENT_META, type AgentId } from "@/lib/types/agents";
import { formatUsdIls } from "./cost";

const KNOWN_AGENTS = Object.keys(AGENT_META) as AgentId[];

export type AgentRunListItem = {
  id: string;
  agentId: string;
  agentTitle: string;
  status: string;
  provider: string;
  model: string | null;
  trigger: string;
  inputPreview: string;
  costUsd: number;
  costLabel: string;
  inputTokens: number;
  outputTokens: number;
  stepCount: number;
  startedAt: Date;
  finishedAt: Date | null;
  error: string | null;
};

export type AgentCostSummary = {
  agentId: string;
  agentTitle: string;
  runCount: number;
  costUsd: number;
  costLabel: string;
};

export type AgentRunDetail = AgentRunListItem & {
  input: string;
  output: string | null;
  steps: {
    id: string;
    stepIndex: number;
    kind: string;
    title: string;
    rationale: string;
    inputPreview: string | null;
    outputPreview: string | null;
    provider: string | null;
    model: string | null;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    costLabel: string;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
  }[];
};

function agentTitle(agentId: string): string {
  if (agentId === "router") return "ניתוב אוטונומי";
  if (KNOWN_AGENTS.includes(agentId as AgentId)) {
    return AGENT_META[agentId as AgentId].titleHe;
  }
  return agentId;
}

export async function getAgentCostSummaries(): Promise<AgentCostSummary[]> {
  const grouped = await db.agentRun.groupBy({
    by: ["agentId"],
    _sum: { costUsd: true },
    _count: { id: true },
  });

  const sorted = [...grouped].sort(
    (a, b) => (b._sum.costUsd ?? 0) - (a._sum.costUsd ?? 0)
  );

  return sorted.map((g) => ({
    agentId: g.agentId,
    agentTitle: agentTitle(g.agentId),
    runCount: g._count.id,
    costUsd: g._sum.costUsd ?? 0,
    costLabel: formatUsdIls(g._sum.costUsd ?? 0),
  }));
}

export async function getRecentAgentRuns(limit = 50): Promise<AgentRunListItem[]> {
  const runs = await db.agentRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { _count: { select: { steps: true } } },
  });

  return runs.map((r) => ({
    id: r.id,
    agentId: r.agentId,
    agentTitle: agentTitle(r.agentId),
    status: r.status,
    provider: r.provider,
    model: r.model,
    trigger: r.trigger,
    inputPreview: r.input.slice(0, 120),
    costUsd: r.costUsd,
    costLabel: formatUsdIls(r.costUsd),
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    stepCount: r._count.steps,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    error: r.error,
  }));
}

export async function getAgentRunDetail(id: string): Promise<AgentRunDetail | null> {
  const r = await db.agentRun.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { stepIndex: "asc" } },
      _count: { select: { steps: true } },
    },
  });
  if (!r) return null;

  return {
    id: r.id,
    agentId: r.agentId,
    agentTitle: agentTitle(r.agentId),
    status: r.status,
    provider: r.provider,
    model: r.model,
    trigger: r.trigger,
    input: r.input,
    output: r.output,
    inputPreview: r.input.slice(0, 120),
    costUsd: r.costUsd,
    costLabel: formatUsdIls(r.costUsd),
    inputTokens: r.inputTokens,
    outputTokens: r.outputTokens,
    stepCount: r._count.steps,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
    error: r.error,
    steps: r.steps.map((s) => ({
      id: s.id,
      stepIndex: s.stepIndex,
      kind: s.kind,
      title: s.title,
      rationale: s.rationale,
      inputPreview: s.inputPreview,
      outputPreview: s.outputPreview,
      provider: s.provider,
      model: s.model,
      inputTokens: s.inputTokens,
      outputTokens: s.outputTokens,
      costUsd: s.costUsd,
      costLabel: formatUsdIls(s.costUsd),
      status: s.status,
      startedAt: s.startedAt,
      finishedAt: s.finishedAt,
    })),
  };
}

export async function getTotalAiCost(): Promise<{ costUsd: number; costLabel: string; runCount: number }> {
  const agg = await db.agentRun.aggregate({
    _sum: { costUsd: true },
    _count: { id: true },
  });
  const costUsd = agg._sum.costUsd ?? 0;
  return {
    costUsd,
    costLabel: formatUsdIls(costUsd),
    runCount: agg._count.id,
  };
}
