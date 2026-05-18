import { AsyncLocalStorage } from "async_hooks";
import type { AgentId } from "@/lib/types/agents";

export type AgentRunContext = {
  runId: string;
  agentId: AgentId;
};

export const agentRunStore = new AsyncLocalStorage<AgentRunContext>();

export function getAgentRunContext(): AgentRunContext | undefined {
  return agentRunStore.getStore();
}

export function withAgentRun<T>(ctx: AgentRunContext, fn: () => Promise<T>): Promise<T> {
  return agentRunStore.run(ctx, fn);
}
