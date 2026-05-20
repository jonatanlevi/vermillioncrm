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
  if (agentId === "ai_ops") return "יועץ עלויות AI";
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

const ILS_TO_USD = 1 / 3.72;

export type AppCostSummary = {
  month: string;
  category: string;
  totalIls: number;
  count: number;
};

export async function getAppCostSummaries(): Promise<AppCostSummary[]> {
  const month = new Date().toISOString().slice(0, 7);
  const rows = await db.operationalCost.groupBy({
    by: ["month", "category"],
    where: { month },
    _sum: { amountIls: true },
    _count: { supabaseId: true },
    orderBy: { _sum: { amountIls: "desc" } },
  });
  return rows.map((r) => ({
    month: r.month,
    category: r.category,
    totalIls: r._sum.amountIls ?? 0,
    count: r._count.supabaseId,
  }));
}

export async function getRecentAppCosts(limit = 60): Promise<{
  id: number; month: string; category: string; amountIls: number;
  description: string | null; autoTracked: boolean; sourceAt: Date;
}[]> {
  const rows = await db.operationalCost.findMany({
    orderBy: { sourceAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.supabaseId,
    month: r.month,
    category: r.category,
    amountIls: r.amountIls,
    description: r.description,
    autoTracked: r.autoTracked,
    sourceAt: r.sourceAt,
  }));
}

export async function getTotalAiCost(): Promise<{
  crmCostUsd: number; crmCostLabel: string; crmRunCount: number;
  appCostIls: number; appCostCount: number;
  totalCostIls: number;
}> {
  const month = new Date().toISOString().slice(0, 7);
  const [crmAgg, appAgg] = await Promise.all([
    db.agentRun.aggregate({ _sum: { costUsd: true }, _count: { id: true } }),
    db.operationalCost.aggregate({
      where: { month },
      _sum: { amountIls: true },
      _count: { supabaseId: true },
    }),
  ]);
  const crmCostUsd = crmAgg._sum.costUsd ?? 0;
  const appCostIls = appAgg._sum.amountIls ?? 0;
  const crmCostIls = crmCostUsd / ILS_TO_USD;
  return {
    crmCostUsd,
    crmCostLabel: formatUsdIls(crmCostUsd),
    crmRunCount: crmAgg._count.id,
    appCostIls,
    appCostCount: appAgg._count.supabaseId,
    totalCostIls: Math.round((crmCostIls + appCostIls) * 100) / 100,
  };
}
