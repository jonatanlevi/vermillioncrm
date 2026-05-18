/**
 * יניקה דרך Supabase Edge Function (crm-export) — בלי service_role ב-CRM.
 */
export type EdgeExportPayload = {
  ok: boolean;
  error?: string;
  monthKey?: string;
  profiles?: Record<string, unknown>[];
  commitments?: Record<string, unknown>[];
  stamps?: { user_id: string; score?: number; ms_diff?: number | null }[];
  onboarding?: { user_id: string; days_completed?: number[] | null }[];
  chats?: { user_id: string; messages?: unknown }[];
  prizePool?: {
    activeSubscribers: number;
    monthlyRevenue: number;
    weeklyPrizeNet: number;
    operationalCosts: number;
  };
  syncedAt?: string;
};

function ingestionUrl(): string | undefined {
  return (
    process.env.VERMILLION_INGESTION_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

function ingestionAnonKey(): string | undefined {
  return (
    process.env.VERMILLION_INGESTION_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  );
}

function crmSecret(): string | undefined {
  return (
    process.env.VERMILLION_CRM_SECRET ||
    process.env.APP_SECRET ||
    process.env.EXPO_PUBLIC_APP_SECRET
  );
}

export function isEdgeExportConfigured(): boolean {
  return Boolean(ingestionUrl() && ingestionAnonKey() && crmSecret());
}

export async function fetchSnapshotViaEdge(): Promise<EdgeExportPayload> {
  const base = ingestionUrl()?.replace(/\/$/, "");
  const anon = ingestionAnonKey();
  const secret = crmSecret();

  if (!base || !anon || !secret) {
    return { ok: false, error: "Edge export לא מוגדר (URL + anon + VERMILLION_CRM_SECRET)" };
  }

  const res = await fetch(`${base}/functions/v1/crm-export`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      "Content-Type": "application/json",
      "x-vermillion-secret": secret,
    },
    body: "{}",
    cache: "no-store",
  });

  const data = (await res.json()) as EdgeExportPayload;
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `crm-export HTTP ${res.status}`,
    };
  }
  return data;
}
