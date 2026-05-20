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
    label: (p) => `שאלה (יום ${p.day}): ${String(p.questionText ?? "").slice(0, 80)}`,
  },
  question_answered: {
    icon: "✅",
    label: (p) => p.skipped ? `דילג על: ${p.questionKey}` : `ענה: "${String(p.value ?? "").slice(0, 60)}"`,
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

// ─── User card ────────────────────────────────────────────────────────────────

type FilterType = "all" | "chat" | "questions" | "games" | "navigation";

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
        <>
          <CurrentStatePanel user={user} />

          {/* Timeline */}
          <div className="mt-3 max-h-72 overflow-y-auto">
            {visible.length === 0 ? (
              <p className="text-center text-xs text-[var(--muted)]">אין events בפילטר זה</p>
            ) : (
              visible.map((ev, i) => (
                <EventRow key={ev.id} event={ev} isLast={i === visible.length - 1} />
              ))
            )}
          </div>
        </>
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
            : "אין נתוני פעילות — צריך להריץ את migration ב-Supabase."}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {visibleUsers.map((user) => (
          <UserCard key={user.userId} user={user} eventFilter={eventFilter} />
        ))}
      </div>
    </div>
  );
}
