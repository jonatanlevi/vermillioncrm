/**
 * האזנה לשינויים ב-Supabase (Realtime) → רענון משתמש ב-CRM.
 * דורש: Realtime מופעל על הטבלאות בדשבורד Supabase.
 */
import { db } from "@/lib/db";
import { getIngestionClient, isIngestionSourceConfigured, resetIngestionClient } from "./app-source";
import {
  markAppUserChurnedFromSource,
  refreshAppUserFromSource,
  syncAppDataFromSource,
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
  "user_activity_events",
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
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempt = 0;

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

function scheduleUserRefresh(userId: string, delayMs = DEBOUNCE_MS) {
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
          if (result.error.includes("טרם נוצר")) {
            // race condition — profile עוד לא מוכן, ננסה שנית אחרי 15s
            scheduleUserRefresh(userId, 15_000);
          } else if (
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
    }, delayMs)
  );
}

async function saveActivityEvent(userId: string, row: Record<string, unknown>) {
  try {
    const occurredAt = row.occurred_at ? new Date(row.occurred_at as string) : new Date();
    await db.appUserEvent.create({
      data: {
        externalId: userId,
        eventType: typeof row.event_type === "string" ? row.event_type : "unknown",
        screen: typeof row.screen === "string" ? row.screen : null,
        payload: row.payload != null ? JSON.stringify(row.payload) : null,
        sessionId: typeof row.session_id === "string" ? row.session_id : null,
        deviceTz: typeof row.device_tz === "string" ? row.device_tz : null,
        occurredAt,
      },
    });
  } catch (e) {
    console.warn("[realtime-sync] saveActivityEvent failed:", e);
  }
}

function handleChange(payload: ChangePayload) {
  lastEventAt = new Date();
  const userId = userIdFromPayload(payload);
  if (!userId) return;

  if (payload.table === "profiles" && payload.eventType === "DELETE") {
    void removeLocalUser(userId);
    return;
  }

  if (
    payload.table === "user_activity_events" &&
    payload.eventType === "INSERT" &&
    payload.new
  ) {
    void saveActivityEvent(userId, payload.new);
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
  startPollSync();
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectAttempt += 1;
  // backoff: 5s, 10s, 20s, max 60s
  const delayMs = Math.min(5_000 * Math.pow(2, reconnectAttempt - 1), 60_000);
  console.info(`[realtime-sync] reconnect in ${delayMs / 1000}s (attempt ${reconnectAttempt})`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (channelRef) {
      void channelRef.unsubscribe().catch(() => {});
      channelRef = null;
    }
    // מאפס את ה-client כדי שה-WebSocket הבא יהיה חדש לחלוטין
    resetIngestionClient();
    started = false;
    startRealtimeSync();
  }, delayMs);
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
  channelRef = channel;

  for (const table of WATCH_TABLES) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => {
        if (channelRef !== channel) return;
        handleChange({
          eventType: payload.eventType,
          new: (payload.new as Record<string, unknown>) ?? null,
          old: (payload.old as Record<string, unknown>) ?? null,
          table,
        });
      }
    );
  }

  let stableResetTimer: ReturnType<typeof setTimeout> | null = null;

  channel.subscribe((status, err) => {
    if (channelRef !== channel) return;
    if (status === "SUBSCRIBED") {
      channelStatus = "live";
      lastError = null;
      console.info("[realtime-sync] מאזין לשינויים ב-Supabase");
      stableResetTimer = setTimeout(() => {
        if (channelRef === channel) reconnectAttempt = 0;
        stableResetTimer = null;
      }, 30_000);
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      if (stableResetTimer) { clearTimeout(stableResetTimer); stableResetTimer = null; }
      channelStatus = "error";
      lastError =
        err?.message ??
        (status === "TIMED_OUT"
          ? "חיבור פג — מנסה שנית אוטומטית"
          : "שגיאת ערוץ — מנסה שנית");
      console.error("[realtime-sync] channel error:", status, lastError);
      scheduleReconnect();
    } else if (status === "CLOSED") {
      if (stableResetTimer) { clearTimeout(stableResetTimer); stableResetTimer = null; }
      channelStatus = "off";
      scheduleReconnect();
    }
  });

  setTimeout(() => {
    if (channelRef !== channel) return;
    if (channelStatus === "connecting") {
      channelStatus = "error";
      lastError =
        "Realtime לא התחבר — בדשבורד Supabase: Database → Replication → הפעל Realtime לטבלאות profiles, commitment, daily_stamps וכו׳";
      scheduleReconnect();
    }
  }, 20_000);
}

// פולינג גיבוי — כל 5 דקות מסנכרן נתונים גם ללא Realtime
const POLL_INTERVAL_MS = 5 * 60 * 1000;
let pollTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePoll() {
  if (pollTimer) return;
  pollTimer = setTimeout(async () => {
    pollTimer = null;
    if (isIngestionSourceConfigured()) {
      try {
        await syncAppDataFromSource();
        console.info("[realtime-sync] poll sync done");
      } catch (e) {
        console.warn("[realtime-sync] poll sync error:", e);
      }
    }
    schedulePoll();
  }, POLL_INTERVAL_MS);
}

export function startPollSync() {
  schedulePoll();
}
