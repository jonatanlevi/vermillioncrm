"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ActivityEvent } from "@/lib/vermillion/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveMessage {
  role: string;
  text: string;
  sentAt: number | null;
  typingMs: number | null;
  responseMs: number | null;
}

interface LiveUser {
  userId: string;
  name: string | null;
  email: string | null;
  subscription: string;
  lastActivity: string | null;
  isLive: boolean;
  stats: { avgTypingMs: number | null; avgResponseMs: number | null; eventCount: number };
  events: ActivityEvent[];
  recentMessages: LiveMessage[];
}

interface LiveData {
  users: LiveUser[];
  fetchedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function msToSec(ms: number | null): string {
  if (ms == null) return "—";
  return (ms / 1000).toFixed(1) + "ש׳";
}

function relativeTime(ts: string | null): string {
  if (!ts) return "—";
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return `לפני ${diff}ש׳`;
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)}ד׳`;
  return `לפני ${Math.floor(diff / 3600)}ש`;
}

function timeStr(ts: string | null): string {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// ─── Event rendering ──────────────────────────────────────────────────────────

const EVENT_META: Record<string, { icon: string; label: (p: Record<string, unknown>) => string }> = {
  screen_view: {
    icon: "👁",
    label: (p) => `עבר למסך: ${p.route ?? ""}`,
  },
  screen_leave: {
    icon: "↩",
    label: (p) => `עזב: ${p.route ?? ""}${p.dwellMs ? ` (${Math.round(Number(p.dwellMs) / 1000)}ש׳)` : ""}`,
  },
  chat_user_message: {
    icon: "💬",
    label: (p) => `שלח: "${String(p.text ?? "").slice(0, 60)}${String(p.text ?? "").length > 60 ? "…" : ""}"${p.typingMs ? ` ⌨ ${msToSec(Number(p.typingMs))}` : ""}`,
  },
  chat_ai_start: {
    icon: "⏳",
    label: () => "AI מתחיל לחשוב…",
  },
  chat_ai_chunk: {
    icon: "📝",
    label: (p) => `סטרימינג — ${p.charsSoFar ?? "?"} תווים`,
  },
  chat_ai_done: {
    icon: "⚡",
    label: (p) => `AI ענה${p.responseMs ? ` ב-${msToSec(Number(p.responseMs))}` : ""}: "${String(p.text ?? "").slice(0, 60)}${String(p.text ?? "").length > 60 ? "…" : ""}"`,
  },
  question_shown: {
    icon: "📋",
    label: (p) => {
      const KEY_LABELS: Record<string, string> = {
        employment_type: "מקצוע",
        family_status: "מצב משפחתי",
        income: "הכנסה",
        expenses: "הוצאות",
        savings: "חסכונות",
        debts: "חובות",
        goals: "מטרות",
      };
      const keyLabel = KEY_LABELS[String(p.questionKey ?? "")] ?? String(p.questionKey ?? "");
      const text = String(p.questionText ?? "").slice(0, 80);
      return `שאלה (יום ${p.day})${keyLabel ? ` [${keyLabel}]` : ""}: ${text}`;
    },
  },
  question_answered: {
    icon: "✅",
    label: (p) => {
      const KEY_LABELS: Record<string, string> = {
        employment_type: "מקצוע",
        family_status: "מצב משפחתי",
        income: "הכנסה",
        expenses: "הוצאות",
        savings: "חסכונות",
        debts: "חובות",
        goals: "מטרות",
      };
      const keyLabel = KEY_LABELS[String(p.questionKey ?? "")] ?? String(p.questionKey ?? "");
      if (p.skipped) return `דילג על: ${keyLabel}`;
      return `${keyLabel}: "${String(p.value ?? "").slice(0, 60)}"`;
    },
  },
  game_started: {
    icon: "🎮",
    label: (p) => `התחיל משחק: ${p.gameKey}`,
  },
  game_finished: {
    icon: "🏆",
    label: (p) => `${p.gameKey} — ${p.score} נקודות, ${p.durationMs ? Math.round(Number(p.durationMs) / 1000) : "?"}ש׳`,
  },
  stamp_attempt: {
    icon: "⏱",
    label: (p) => p.ok
      ? `חתם בהצלחה — דיוק ${p.msDiff != null ? `${(Math.abs(Number(p.msDiff)) / 1000).toFixed(1)}ש׳` : "?"}`
      : `חתימה נכשלה: ${p.error ?? "שגיאה"}`,
  },
  commitment_set: {
    icon: "🔒",
    label: (p) => `נעל שעה (${p.kind}): ${String(p.hour ?? "").padStart(2, "0")}:${String(p.minute ?? "").padStart(2, "0")}`,
  },
  profile_updated: {
    icon: "👤",
    label: (p) => `עדכן פרופיל: ${Array.isArray(p.fields) ? p.fields.join(", ") : ""}`,
  },
  avatar_setup_complete: {
    icon: "🎭",
    label: (p) => {
      const ARCHETYPE: Record<string, string> = { warrior: "לוחם", sage: "חכם", royal: "מלכותי", street: "רחוב" };
      const GOAL: Record<string, string> = { money: "עושר 💰", freedom: "חופש 🕊️", growth: "צמיחה 📈" };
      const arch = ARCHETYPE[String(p.archetype ?? "")] ?? String(p.archetype ?? "");
      const goal = GOAL[String(p.goal_focus ?? "")] ?? String(p.goal_focus ?? "");
      return `אווטאר נבחר: ${arch}${goal ? ` · מטרה: ${goal}` : ""}`;
    },
  },
};

function EventRow({ event, isLast }: { event: ActivityEvent; isLast: boolean }) {
  const meta = EVENT_META[event.event_type] ?? {
    icon: "•",
    label: () => event.event_type,
  };
  const payload = event.payload ?? {};
  const isChat = event.event_type.startsWith("chat_");
  const isError = event.event_type === "stamp_attempt" && !payload.ok;

  return (
    <div className="flex gap-2 text-xs" dir="rtl">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] ${
            isError
              ? "bg-red-900/50 text-red-300"
              : isChat
              ? "bg-[var(--accent-dim)]/30 text-[var(--accent)]"
              : "bg-white/5 text-[var(--muted)]"
          }`}
        >
          {meta.icon}
        </div>
        {!isLast && <div className="mt-0.5 w-px flex-1 bg-white/10" style={{ minHeight: 12 }} />}
      </div>

      {/* Content */}
      <div className="mb-2 min-w-0 flex-1">
        <p className={`leading-snug ${isError ? "text-red-300" : "text-[var(--foreground)]"}`}>
          {meta.label(payload as Record<string, unknown>)}
        </p>
        <div className="mt-0.5 flex gap-2 text-[10px] text-[var(--muted)]">
          <span>{timeStr(event.occurred_at)}</span>
          {event.screen && <span>· {event.screen}</span>}
        </div>
      </div>
    </div>
  );
}

// ─── Current state panel ─────────────────────────────────────────────────────

function CurrentStatePanel({ user }: { user: LiveUser }) {
  const lastEvent = user.events[0];
  const lastScreen = user.events.find((e) => e.event_type === "screen_view")?.payload?.route as string | undefined;
  const lastQuestion = user.events.find((e) => e.event_type === "question_shown");
  const lastAnswer = user.events.find((e) => e.event_type === "question_answered");
  const lastGame = user.events.find((e) => e.event_type === "game_started");

  return (
    <div className="space-y-2 rounded-xl border border-[var(--border)] bg-white/3 p-3 text-xs" dir="rtl">
      <p className="font-semibold text-[var(--muted)]">מה רואה עכשיו</p>
      {lastScreen && (
        <div className="flex items-center gap-1.5">
          <span>👁</span>
          <span className="text-white">מסך: {lastScreen}</span>
          <span className="text-[var(--muted)]">· {relativeTime(lastEvent?.occurred_at ?? null)}</span>
        </div>
      )}
      {lastQuestion && !lastAnswer && (
        <div className="flex items-start gap-1.5">
          <span>📋</span>
          <span className="text-amber-300">
            שאלה פתוחה (יום {(lastQuestion.payload as { day?: number }).day}):{" "}
            {String((lastQuestion.payload as { questionText?: string }).questionText ?? "").slice(0, 80)}
          </span>
        </div>
      )}
      {lastGame && (
        <div className="flex items-center gap-1.5">
          <span>🎮</span>
          <span className="text-emerald-300">
            משחק: {(lastGame.payload as { gameKey?: string }).gameKey}
          </span>
        </div>
      )}
      {user.stats.avgTypingMs != null && (
        <div className="flex gap-3 text-[var(--muted)]">
          <span>⌨ ממוצע הקלדה: {msToSec(user.stats.avgTypingMs)}</span>
          {user.stats.avgResponseMs != null && (
            <span>⚡ AI: {msToSec(user.stats.avgResponseMs)}</span>
          )}
        </div>
      )}
    </div>
  );
}

type FilterType = "all" | "chat" | "questions" | "games" | "navigation";

const TRANSCRIPT_EVENT_TYPES = new Set([
  "question_shown",
  "question_answered",
  "chat_user_message",
  "chat_ai_done",
]);

/** תמליל מלא — שאלות/תשובות וצ׳אט, בסדר כרונולוגי (מתאים לזמנים ביומן) */
function ChatTranscriptPanel({
  events,
  recentMessages,
}: {
  events: ActivityEvent[];
  recentMessages: LiveMessage[];
}) {
  const transcriptEvents = [...events]
    .filter((e) => TRANSCRIPT_EVENT_TYPES.has(e.event_type))
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());

  if (transcriptEvents.length === 0) {
    if (recentMessages.length === 0) {
      return (
        <div
          className="flex h-full min-h-[200px] flex-col rounded-xl border border-[var(--border)] border-dashed bg-black/20 p-4"
          dir="rtl"
        >
          <h3 className="text-sm font-semibold text-[var(--muted)]">תמליל שיחה</h3>
          <p className="mt-3 text-xs text-[var(--muted)]">
            אין עדיין הודעות צ׳אט או שאלון בחלון הזמן — אחרי פעילות תופיע כאן השיחה מול VerMillion.
          </p>
        </div>
      );
    }
    return (
      <div
        className="flex h-full min-h-[240px] flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-inner"
        dir="rtl"
      >
        <h3 className="border-b border-[var(--border)]/60 pb-2 text-sm font-semibold text-white">
          תמליל שיחה · מעותק <span className="text-[var(--muted)]">chat_history</span>
        </h3>
        <p className="mt-1 text-[10px] text-[var(--muted)]">
          אין אירועי פעילות מסוג צ׳אט בשעה האחרונה — מוצגות ההודעות האחרונות מהמאגר.
        </p>
        <div className="mt-3 max-h-[min(72vh,520px)] flex-1 space-y-2 overflow-y-auto pr-1">
          {recentMessages.map((m, i) => {
            const isUser = m.role === "user" || m.role === "human";
            const t =
              m.sentAt != null
                ? new Date(m.sentAt).toLocaleTimeString("he-IL", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "—";
            return (
              <div
                key={`${m.role}-${i}-${m.text.slice(0, 20)}`}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  isUser
                    ? "border-sky-800/50 bg-sky-950/25 text-sky-100"
                    : "border-violet-800/40 bg-violet-950/20 text-violet-100"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-[var(--muted)]">
                  <span className="font-semibold text-white/90">
                    {isUser ? "משתמש" : "VerMillion"}
                  </span>
                  <span dir="ltr" className="font-mono opacity-80">
                    {t}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{m.text || "—"}</p>
                {(m.typingMs != null || m.responseMs != null) && (
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {m.typingMs != null && m.typingMs > 0 && <>⌨ הקלדה {msToSec(m.typingMs)}</>}
                    {m.typingMs != null && m.responseMs != null && " · "}
                    {m.responseMs != null && m.responseMs > 0 && <>תגובה {msToSec(m.responseMs)}</>}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-[240px] flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-inner"
      dir="rtl"
    >
      <h3 className="border-b border-[var(--border)]/60 pb-2 text-sm font-semibold text-white">
        תמליל שיחה · VerMillion ↔ משתמש
      </h3>
      <p className="mt-1 text-[10px] text-[var(--muted)]">
        אותם אירועים כמו ביומן — לפי זמן (ישן → חדש).
      </p>
      <div className="mt-3 max-h-[min(72vh,520px)] flex-1 space-y-3 overflow-y-auto pr-1">
        {transcriptEvents.map((ev) => {
          const p = (ev.payload ?? {}) as Record<string, unknown>;
          const clock = timeStr(ev.occurred_at);
          if (ev.event_type === "question_shown") {
            const day = p.day != null ? String(p.day) : "?";
            const qText = String(p.questionText ?? "");
            const key = String(p.questionKey ?? "");
            return (
              <div
                key={ev.id}
                className="rounded-lg border border-amber-800/40 bg-amber-950/15 px-3 py-2 text-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-amber-200/80">
                  <span className="font-semibold text-amber-100">📋 VerMillion — שאלה (יום {day})</span>
                  <span dir="ltr" className="font-mono">
                    {clock}
                  </span>
                </div>
                {key && <p className="mb-1 text-[10px] text-[var(--muted)]">מפתח: {key}</p>}
                <p className="whitespace-pre-wrap leading-relaxed text-amber-50">{qText || "—"}</p>
              </div>
            );
          }
          if (ev.event_type === "question_answered") {
            const skipped = Boolean(p.skipped);
            const val = String(p.value ?? "");
            const key = String(p.questionKey ?? "");
            return (
              <div
                key={ev.id}
                className="rounded-lg border border-sky-800/45 bg-sky-950/20 px-3 py-2 text-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-sky-200/80">
                  <span className="font-semibold text-sky-100">
                    {skipped ? "משתמש — דילג" : "משתמש — תשובה"}
                  </span>
                  <span dir="ltr" className="font-mono">
                    {clock}
                  </span>
                </div>
                {key && <p className="mb-1 text-[10px] text-[var(--muted)]">{key}</p>}
                <p className="whitespace-pre-wrap leading-relaxed">{skipped ? "(דילוג)" : val || "—"}</p>
              </div>
            );
          }
          if (ev.event_type === "chat_user_message") {
            const text = String(p.text ?? "");
            const typing = p.typingMs != null ? Number(p.typingMs) : null;
            return (
              <div
                key={ev.id}
                className="rounded-lg border border-sky-800/50 bg-sky-950/25 px-3 py-2 text-sm text-sky-100"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-sky-200/80">
                  <span className="font-semibold">משתמש</span>
                  <span dir="ltr" className="font-mono">
                    {clock}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{text || "—"}</p>
                {typing != null && typing > 0 && (
                  <p className="mt-1 text-[10px] text-[var(--muted)]">⌨ הקלדה {msToSec(typing)}</p>
                )}
              </div>
            );
          }
          if (ev.event_type === "chat_ai_done") {
            const text = String(p.text ?? "");
            const responseMs = p.responseMs != null ? Number(p.responseMs) : null;
            return (
              <div
                key={ev.id}
                className="rounded-lg border border-violet-800/45 bg-violet-950/25 px-3 py-2 text-sm text-violet-100"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[10px] text-violet-200/80">
                  <span className="font-semibold">VerMillion</span>
                  <span dir="ltr" className="font-mono">
                    {clock}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{text || "—"}</p>
                {responseMs != null && responseMs > 0 && (
                  <p className="mt-1 text-[10px] text-[var(--muted)]">⚡ תגובה ב-{msToSec(responseMs)}</p>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

const FILTER_TYPES: Record<FilterType, string[]> = {
  all: [],
  chat: ["chat_user_message", "chat_ai_start", "chat_ai_chunk", "chat_ai_done"],
  questions: ["question_shown", "question_answered"],
  games: ["game_started", "game_finished", "stamp_attempt", "commitment_set"],
  navigation: ["screen_view", "screen_leave"],
};

function UserCard({ user, eventFilter }: { user: LiveUser; eventFilter: FilterType }) {
  const [expanded, setExpanded] = useState(true);

  const filtered =
    eventFilter === "all"
      ? user.events
      : user.events.filter((e) => FILTER_TYPES[eventFilter].includes(e.event_type));

  // Hide chunk events unless explicitly showing chat
  const visible = filtered.filter(
    (e) => eventFilter === "chat" || e.event_type !== "chat_ai_chunk"
  );

  return (
    <div
      className={`rounded-xl border p-4 ${
        user.isLive
          ? "border-emerald-600/50 bg-emerald-950/10"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2" dir="rtl">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {user.isLive && (
              <span className="inline-block h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-emerald-400" />
            )}
            <Link
              href={`/vermillion/users/${user.userId}`}
              className="truncate font-semibold hover:underline"
            >
              {user.name || user.email || user.userId.slice(0, 8)}
            </Link>
            <span
              className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                user.subscription === "premium"
                  ? "bg-yellow-900/40 text-yellow-300"
                  : "bg-white/5 text-[var(--muted)]"
              }`}
            >
              {user.subscription === "premium" ? "💎 פרמיום" : "חינמי"}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-[var(--muted)]">
            {user.stats.eventCount} events ·{" "}
            {relativeTime(user.lastActivity)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex-shrink-0 rounded px-2 py-0.5 text-[10px] text-[var(--muted)] hover:bg-white/5"
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-4 lg:flex-row" dir="rtl">
          {/* RIGHT — state + timeline */}
          <div className="w-full flex-shrink-0 lg:w-72">
            <CurrentStatePanel user={user} />
            <div className="mt-3 max-h-[420px] overflow-y-auto">
              {visible.length === 0 ? (
                <p className="text-center text-xs text-[var(--muted)]">אין events בפילטר זה</p>
              ) : (
                visible.map((ev, i) => (
                  <EventRow key={ev.id} event={ev} isLast={i === visible.length - 1} />
                ))
              )}
            </div>
          </div>
          {/* LEFT — conversation transcript */}
          <div className="min-w-0 flex-1">
            <ChatTranscriptPanel events={user.events} recentMessages={user.recentMessages} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LiveMonitor() {
  const [data, setData] = useState<LiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<"all" | "live">("all");
  const [eventFilter, setEventFilter] = useState<FilterType>("all");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/app/live", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setData(json);
        setError(null);
      } else {
        setError(json.error ?? "שגיאה");
      }
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(fetchData, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const allUsers = data?.users ?? [];
  const liveCount = allUsers.filter((u) => u.isLive).length;
  const visibleUsers =
    userFilter === "live" ? allUsers.filter((u) => u.isLive) : allUsers;

  const EVENT_FILTER_LABELS: Record<FilterType, string> = {
    all: "הכל",
    chat: "💬 צ'אט",
    questions: "📋 שאלון",
    games: "🎮 משחקים",
    navigation: "👁 ניווט",
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">🟢 Live Monitor</h1>
          <p className="text-xs text-[var(--muted)]">
            {loading
              ? "טוען..."
              : data
              ? `${allUsers.length} משתמשים · ${liveCount} פעילים עכשיו · עדכון כל 5ש׳`
              : ""}
            {data && (
              <span className="mr-2 opacity-50">
                · {new Date(data.fetchedAt).toLocaleTimeString("he-IL")}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* User filter */}
          <div className="flex gap-1 rounded-lg border border-[var(--border)] p-0.5">
            {(["all", "live"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setUserFilter(f)}
                className={`rounded px-2.5 py-1 text-xs ${
                  userFilter === f
                    ? f === "live"
                      ? "bg-emerald-700 text-white"
                      : "bg-[var(--accent-dim)] text-white"
                    : "text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                {f === "all" ? `כולם (${allUsers.length})` : `🟢 פעילים (${liveCount})`}
              </button>
            ))}
          </div>

          {/* Event type filter */}
          <div className="flex gap-1 rounded-lg border border-[var(--border)] p-0.5">
            {(Object.keys(EVENT_FILTER_LABELS) as FilterType[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setEventFilter(f)}
                className={`rounded px-2 py-1 text-xs ${
                  eventFilter === f
                    ? "bg-white/10 text-white"
                    : "text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                {EVENT_FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => { setLoading(true); fetchData(); }}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] hover:bg-white/5"
          >
            רענן
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      {!loading && visibleUsers.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          {userFilter === "live"
            ? "אין משתמשים פעילים כרגע (אירוע ב-5 דקות האחרונות)."
            : "אין פעילות בשעה האחרונה — ברגע שמשתמש יפתח את האפליקציה יופיע כאן."}
        </p>
      )}

      <div className="grid gap-4">
        {visibleUsers.map((user) => (
          <UserCard key={user.userId} user={user} eventFilter={eventFilter} />
        ))}
      </div>
    </div>
  );
}
