export type AgentId =
  | "campaigns"
  | "finance"
  | "whatsapp"
  | "sales"
  | "media"
  | "vermillion";

export interface AgentContext {
  agentId: AgentId;
  input: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResult {
  agentId: AgentId;
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  nextJobs?: AutomationJobSpec[];
}

export interface AutomationJobSpec {
  type: string;
  payload: Record<string, unknown>;
  delayMs?: number;
}

export const AGENT_META: Record<
  AgentId,
  { title: string; titleHe: string; description: string; href: string }
> = {
  campaigns: {
    title: "Campaign Agent",
    titleHe: "שיווק וקמפיינים",
    description: "13 רשתות — תוכן, תזמון והפצה",
    href: "/campaigns",
  },
  finance: {
    title: "Finance Agent",
    titleHe: "כספים והנהלת חשבונות",
    description: "הכנסות, הוצאות, חשבוניות ותזרים",
    href: "/finance",
  },
  whatsapp: {
    title: "WhatsApp Agent",
    titleHe: "וואטסאפ ולקוחות",
    description: "תקשורת, לידים ומעקב מסרים",
    href: "/whatsapp",
  },
  sales: {
    title: "Sales & Ops Agent",
    titleHe: "מכירות וצינור",
    description: "לידים, עסקאות וסגירות",
    href: "/sales",
  },
  media: {
    title: "Media Agent",
    titleHe: "מדיה וקריאייטיב",
    description: "תמונות ווידאו לקמפיינים",
    href: "/media",
  },
  vermillion: {
    title: "VerMillion App Users",
    titleHe: "מוצר VerMillion",
    description: "מנויים, מעורבות, פרימיום — מסונכרן מאפליקציית הלקוח",
    href: "/vermillion",
  },
};
