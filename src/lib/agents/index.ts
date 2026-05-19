import type { AgentId } from "@/lib/types/agents";
import { CampaignAgent } from "./campaign-agent";
import { FinanceAgent } from "./finance-agent";
import { MediaAgent } from "./media-agent";
import { SalesAgent } from "./sales-agent";
import { VermillionAgent } from "./vermillion-agent";
import { WhatsappAgent } from "./whatsapp-agent";
import { AiOpsAgent } from "./ai-ops-agent";
import type { BaseAgent } from "./base-agent";

const agents: Record<AgentId, BaseAgent> = {
  campaigns: new CampaignAgent(),
  finance: new FinanceAgent(),
  whatsapp: new WhatsappAgent(),
  sales: new SalesAgent(),
  media: new MediaAgent(),
  vermillion: new VermillionAgent(),
  ai_ops: new AiOpsAgent(),
};

export function getAgent(id: AgentId): BaseAgent {
  const agent = agents[id];
  if (!agent) throw new Error(`Unknown agent: ${id}`);
  return agent;
}

export {
  CampaignAgent,
  FinanceAgent,
  WhatsappAgent,
  SalesAgent,
  MediaAgent,
  VermillionAgent,
  AiOpsAgent,
};
