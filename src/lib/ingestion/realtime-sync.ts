/**
 * האזנה לשינויים ב-Supabase (Realtime) → רענון משתמש ב-CRM.
 * דורש: Realtime מופעל על הטבלאות בדשבורד Supabase.
 */
import { getIngestionClient, isIngestionSourceConfigured } from "./app-source";
import {
  markAppUserChurnedFromSource,
  refreshAppUserFromSource,
} from "@/lib/vermillion/sync";

const DEBOUNCE_MS = 2_000;

const WATCH_TABLES = [
  "profiles",
  "commitment",
  "daily_stamps",
  "onboarding_state",
  "onboarding_answers",
  "chat_history",
  "financial_data",
  "game_sessions",
  "daily_logs",
  "game_log",
] as const;

type ChangePayload = {
  eventType: string;
  new: Record<string, unknown> | null;
  old: Record<string, unknown> | null;
  table: string;
};

let started = false;
let channelRef: ReturnType<NonNullable<ReturnType<typeof getIngestionClient>>["channel"]> | null =
  null;
let channelStatus: "off" | "connecting" | "live" | "error" = "off";
let lastEventAt: Date | null = null;
let lastError: string | null = null;

const pending = new Map<string, ReturnType<typeof setTimeout>>();

function realtimeEnabled(): boolean {
  return process.env.VERMILLION_REALTIME_SYNC !== "false";
}

function userIdFromPayload(payload: ChangePayload): string | null {
  const row = payload.new ?? payload.old;
  if (!row) return null;
  if (payload.table === "profiles") {
    const id = row.id;
    return typeof id === "string" ? id : null;
  }
  const uid = row.user_id;
  return typeof uid === "string" ? uid : null;
}

function removeLocalUser(externalId: string) {
  void markAppUserChurnedFromSource(externalId);
}

function scheduleUserRefresh(userId: string) {
  const existing = pending.get(userId);
  if (existing) clearTimeout(existing);

  pending.set(
    userId,
    setTimeout(async () => {
      pending.delete(userId);
      try {
        const result = await refreshAppUserFromSource(userId);
        if (!result.ok) {
          console.warn("[realtime-sync] refresh failed:", userId, result.error);
          if (
            result.error.includes("נטש") ||
            result.error.includes("Auth נמחק") ||
            result.error.includes("לא נמצא")
          ) {
            void markAppUserChurnedFromSource(userId);
          }
        }
      } catch (e) {
        console.warn("[realtime-sync] refresh error:", userId, e);
      }
    }, DEBOUNCE_MS)
  );
}

function handleChange(payload: ChangePayload) {
  lastEventAt = new Date();
  const userId = userIdFromPayload(payload);
  if (!userId) return;

  if (payload.table === "profiles" && payload.eventType === "DELETE") {
    void removeLocalUser(userId);
    return;
  }

  scheduleUserRefresh(userId);
}

export function getRealtimeSyncStatus() {
  ensureRealtimeSyncStarted();
  return {
    enabled: realtimeEnabled() && isIngestionSourceConfigured(),
    status: channelStatus,
    lastEventAt,
    lastError,
    tables: WATCH_TABLES,
  };
}

/** מפעיל האזנה Realtime אם עדיין לא רצה (נדרש אחרי HMR / בלי instrumentation) */
export function ensureRealtimeSyncStarted() {
  if (started) return;
  startRealtimeSync();
}

export function startRealtimeSync() {
  if (started) return;
  if (!realtimeEnabled()) {
    channelStatus = "off";
    return;
  }
  if (!isIngestionSourceConfigured()) {
    channelStatus = "off";
    return;
  }

  const sb = getIngestionClient();
  if (!sb) {
    channelStatus = "error";
    lastError = "אין חיבור Supabase";
    return;
  }

  started = true;
  channelStatus = "connecting";

  const channel = sb.channel("vermillion-crm-sync");

  for (const table of WATCH_TABLES) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        handleChange({
          eventType: payload.eventType,
          new: (payload.new as Record<string, unknown>) ?? null,
          old: (payload.old as Record<string, unknown>) ?? null,
          table,
        });
      }
    );
  }

  channel.subscribe((status, err) => {
    if (status === "SUBSCRIBED") {
      channelStatus = "live";
      lastError = null;
      console.info("[realtime-sync] מאזין לשינויים ב-Supabase");
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      channelStatus = "error";
      lastError = err?.message ?? status;
      console.error("[realtime-sync] channel error:", lastError);
    } else if (status === "CLOSED") {
      channelStatus = "off";
    }
  });

  setTimeout(() => {
    if (channelStatus === "connecting") {
      channelStatus = "error";
      lastError =
        "Realtime לא התחבר — בדשבורד Supabase: Database → Replication → הפעל Realtime לטבלאות profiles, commitment, daily_stamps וכו׳";
    }
  }, 20_000);
}
