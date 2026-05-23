import Link from "next/link";
import { auth } from "@/auth";
import { getVermillionUserDetail, formatTimer } from "@/lib/vermillion/queries";
import { IngestionGate } from "./ingestion-gate";
import { UserAdminActions } from "./user-admin-actions";
import {
  QUESTION_MAP,
  DAY_META,
  formatAnswer,
  flattenDailyAnswers,
} from "@/lib/vermillion/question-map";

export async function VermillionUserDetail({ userId }: { userId: string }) {
  const [user, session] = await Promise.all([getVermillionUserDetail(userId), auth()]);
  const isCeo = session?.user?.role === "CEO";

  if (!user) {
    return (
      <p className="text-[var(--muted)]">
        משתמש לא נמצא. <Link href="/vermillion/users">חזרה לרשימה</Link>
      </p>
    );
  }

  const c = user.commitment;

  return (
    <IngestionGate>
    <div className="space-y-6" dir="rtl">
      <Link href="/vermillion/users" className="text-sm text-[var(--accent)] hover:underline">
        ← חזרה לכל המשתמשים
      </Link>

      <header>
        <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
        <p className="text-sm text-[var(--muted)]">{user.id}</p>
        {user.ceoDeletedAt && (
          <p className="mt-2 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
            נמחק על ידי מנכ״ל ·{" "}
            {new Date(user.ceoDeletedAt).toLocaleString("he-IL")}
            {" · "}
            <Link href="/vermillion/churned" className="underline">
              רשימת לא פעילים
            </Link>
          </p>
        )}
        {user.deletedAt && !user.ceoDeletedAt && (
          <p className="mt-2 rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300">
            משתמש נטש · {new Date(user.deletedAt).toLocaleString("he-IL")}
          </p>
        )}
        <p className="mt-1 text-xs text-[var(--muted)]">
          «רענן מהאפליקציה» מעדכן צ׳אט, משחקים וזיכרון AI
        </p>
      </header>

      <UserAdminActions
        userId={user.id}
        email={user.email}
        name={user.name || user.first_name}
        isCeo={isCeo}
        isRemoved={user.deletedAt != null}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="מנוי" value={user.subscription} />
        <Card title="טיימר DNA" value={user.timerDisplay ?? "לא הוגדר"} mono />
        <Card title="Streak" value={String(c?.streak_days ?? 0)} />
        <Card title="Stamps החודש" value={String(user.stampsThisMonth)} />
        <Card title="ניקוד החודש" value={String(user.totalScoreThisMonth)} />
        <Card
          title="הפרש ממוצע (ms)"
          value={user.avgMsDiffThisMonth != null ? String(user.avgMsDiffThisMonth) : "—"}
          mono
        />
        <Card title="משחקים" value={String(user.game_sessions_count)} />
        <Card title="הודעות AI" value={String(user.chatMessageCount)} />
        <Card title="V-Coins" value={String(user.v_coins ?? 0)} />
        <Card title="אזור זמן" value={user.timezone ?? "UTC"} />
      </div>

      {user.auth_meta && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-3 font-semibold">התחברות (Auth)</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Item
              label="נרשם"
              value={
                user.auth_meta.created_at
                  ? new Date(user.auth_meta.created_at).toLocaleString("he-IL")
                  : "—"
              }
            />
            <Item
              label="התחברות אחרונה"
              value={
                user.auth_meta.last_sign_in_at
                  ? new Date(user.auth_meta.last_sign_in_at).toLocaleString("he-IL")
                  : "—"
              }
            />
            <Item label="ספק" value={user.auth_meta.provider ?? "—"} />
          </dl>
        </section>
      )}

      {c && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-3 font-semibold">⏱ התחייבות / טיימר</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Item label="שעת DNA יומית" value={user.timerDisplay ?? "—"} />
            <Item
              label="שישי (אתגר)"
              value={formatTimer(c.friday_target_hour, c.friday_target_minute) ?? "—"}
            />
            <Item
              label="שבת (אתגר)"
              value={formatTimer(c.saturday_target_hour, c.saturday_target_minute) ?? "—"}
            />
            <Item
              label="התחייבות מקורית"
              value={
                c.committed_at
                  ? new Date(c.committed_at).toLocaleString("he-IL")
                  : "—"
              }
            />
            <Item
              label="עודכן"
              value={new Date(c.updated_at).toLocaleString("he-IL")}
            />
          </dl>
        </section>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 font-semibold">פרטים אישיים</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Item label="אימייל" value={user.email ?? "—"} />
          <Item label="טלפון" value={user.phone ?? "—"} />
          <Item label="תאריך לידה" value={user.date_of_birth ?? "—"} />
          <Item label="אונבורדינג" value={`${user.onboardingDays}/7 ימים`} />
          <Item label="אונבורדינג הושלם" value={user.onboarding_complete ? "כן" : "לא"} />
          <Item label="פרופיל מלא" value={user.profile_intake_complete ? "כן" : "לא"} />
          <Item label="שפה" value={user.lang ?? "—"} />
          <Item
            label="הצטרף"
            value={new Date(user.joined_at).toLocaleDateString("he-IL")}
          />
          <Item
            label="סונכרן ל-CRM"
            value={
              user.syncedAt
                ? new Date(user.syncedAt).toLocaleString("he-IL")
                : "—"
            }
          />
        </dl>
      </section>

      {!c && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-2 font-semibold">⏱ התחייבות / טיימר DNA</h2>
          <p className="text-sm text-[var(--muted)]">לא הוגדר טיימר — רענן מהאפליקציה אחרי הגדרה</p>
        </section>
      )}

      {user.onboardingDays === 0 &&
        (!user.daily_answers || Object.keys(user.daily_answers).length === 0) &&
        user.onboarding_answers.length === 0 &&
        (!user.financial_data || Object.keys(user.financial_data).length === 0) && (
          <EmptyHint text="אין תשובות אונבורדינג — לחץ «רענן מהאפליקציה»" />
        )}

      {(user.onboardingDays > 0 ||
        user.onboarding_answers.length > 0 ||
        (user.daily_answers && Object.keys(user.daily_answers).length > 0) ||
        (user.financial_data && Object.keys(user.financial_data).length > 0)) && (
        <DailyAnswersSection
          dailyAnswers={user.daily_answers ?? {}}
          daysCompletedOverride={user.onboarding_days_completed}
          onboardingAnswers={user.onboarding_answers}
          financialData={user.financial_data}
        />
      )}

      {user.financial_data && Object.keys(user.financial_data).length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-3 font-semibold">פרופיל פיננסי (אפיון)</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {Object.entries(user.financial_data).map(([key, val]) => (
              <Item
                key={key}
                label={key}
                value={val != null && val !== "" ? String(val) : "—"}
              />
            ))}
          </dl>
        </section>
      )}

      {(!user.ai_memory?.insights || user.ai_memory.insights.length === 0) && (
        <EmptyHint text="אין זיכרון AI עדיין" />
      )}

      {user.ai_memory?.insights && user.ai_memory.insights.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-3 font-semibold">
            זיכרון AI ({user.ai_memory.sessionCount ?? 0} שיחות)
          </h2>
          <ul className="space-y-2 text-sm">
            {user.ai_memory.insights.map((line, i) => (
              <li key={i} className="rounded-lg bg-black/20 px-3 py-2">
                {line}
              </li>
            ))}
          </ul>
        </section>
      )}

      {user.chat_messages.length === 0 && user.chatMessageCount === 0 && (
        <EmptyHint text="אין היסטוריית צ׳אט — רענן מהאפליקציה" />
      )}

      {user.chat_messages.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between" dir="rtl">
            <h2 className="font-semibold">שיחת VerMillion ↔ משתמש</h2>
            <span className="text-xs text-[var(--muted)]">{user.chat_messages.length} הודעות</span>
          </div>
          <div className="max-h-[520px] space-y-3 overflow-y-auto pl-1" dir="rtl">
            {user.chat_messages.map((m, i) => {
              const isUser = m.role === "user" || m.role === "human";
              const t = m.sentAt
                ? new Date(m.sentAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
                : null;
              return (
                <div key={i} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div className="mb-0.5 flex items-center gap-1.5 px-1 text-[10px] text-[var(--muted)]">
                    {!isUser && <span className="font-semibold text-[var(--accent)]">VerMillion</span>}
                    {isUser && <span className="font-semibold text-sky-400">משתמש</span>}
                    {t && <span dir="ltr">{t}</span>}
                  </div>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? "rounded-tl-sm bg-sky-950/60 text-sky-50 ring-1 ring-sky-800/40"
                        : "rounded-tr-sm bg-[var(--accent-dim)]/20 text-[var(--foreground)] ring-1 ring-[var(--accent)]/20"
                    }`}
                  >
                    {m.text || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {user.game_sessions.length === 0 && user.game_sessions_count === 0 && (
        <EmptyHint text="אין משחקים רשומים" />
      )}

      {user.game_sessions.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 overflow-x-auto">
          <h2 className="mb-3 font-semibold">משחקים ({user.game_sessions_count})</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--muted)]">
                <th className="pb-2 text-right">משחק</th>
                <th className="pb-2 text-right">הושלם</th>
                <th className="pb-2 text-right">משך (ms)</th>
                <th className="pb-2 text-right">ניקוד</th>
                <th className="pb-2 text-right">טוקן</th>
              </tr>
            </thead>
            <tbody>
              {user.game_sessions.map((g) => (
                <tr key={g.id} className="border-t border-[var(--border)]/40">
                  <td className="py-2">{g.game_key ?? g.game_type ?? "—"}</td>
                  <td className="py-2">
                    {g.completed_at
                      ? new Date(g.completed_at).toLocaleString("he-IL")
                      : "—"}
                  </td>
                  <td className="py-2">{g.duration_ms ?? "—"}</td>
                  <td className="py-2">{g.game_score ?? g.score ?? "—"}</td>
                  <td className="py-2">
                    {g.token_used === true ? "נוצל" : g.token_used === false ? "לא נוצל" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {user.onboarding_days_completed.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-3 font-semibold">ימי אונבורדינג שהושלמו</h2>
          <p className="text-sm">{user.onboarding_days_completed.join(", ")}</p>
        </section>
      )}

      {user.daily_logs && user.daily_logs.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 overflow-x-auto">
          <h2 className="mb-3 font-semibold">ימי תוכנית 9–30 ({user.daily_logs.length})</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--muted)]">
                <th className="pb-2 text-right">יום</th>
                <th className="pb-2 text-right">אתגר</th>
                <th className="pb-2 text-right">מכפיל</th>
                <th className="pb-2 text-right">אימון</th>
              </tr>
            </thead>
            <tbody>
              {user.daily_logs.map((log) => (
                <tr key={log.id} className="border-t border-[var(--border)]/40">
                  <td className="py-2">{log.day}</td>
                  <td className="py-2">{log.challenge_done ? "✓" : "—"}</td>
                  <td className="py-2">{log.multiplier}</td>
                  <td className="py-2 max-w-xs truncate">
                    {log.coaching_answer?.slice(0, 80) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {user.recent_stamps.length === 0 && user.stampsThisMonth === 0 && (
        <EmptyHint text="אין Stamps החודש" />
      )}

      {user.recent_stamps.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 overflow-x-auto">
          <h2 className="mb-3 font-semibold">היסטוריית Stamps</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[var(--muted)]">
                <th className="pb-2 text-right">יום</th>
                <th className="pb-2 text-right">חודש</th>
                <th className="pb-2 text-right">זמן Stamp</th>
                <th className="pb-2 text-right">יעד</th>
                <th className="pb-2 text-right">הפרש (ms)</th>
                <th className="pb-2 text-right">ניקוד</th>
              </tr>
            </thead>
            <tbody>
              {user.recent_stamps.map((s) => (
                <tr key={s.id} className="border-t border-[var(--border)]/40">
                  <td className="py-2">{s.day}</td>
                  <td className="py-2">{s.month_key}</td>
                  <td className="py-2">
                    {new Date(s.stamped_at).toLocaleString("he-IL")}
                  </td>
                  <td className="py-2 font-mono">
                    {formatTimer(s.committed_hour, s.committed_minute) ?? "—"}
                  </td>
                  <td className="py-2">{s.ms_diff ?? "—"}</td>
                  <td className="py-2">{s.score ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
    </IngestionGate>
  );
}

function Card({
  title,
  value,
  mono,
}: {
  title: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs text-[var(--muted)]">{title}</p>
      <p className={`mt-1 text-lg font-bold ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-lg border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
      {text}
    </p>
  );
}

function DailyAnswersSection({
  dailyAnswers,
  daysCompletedOverride = [],
  onboardingAnswers = [],
  financialData = null,
}: {
  dailyAnswers: Record<string, unknown>;
  daysCompletedOverride?: number[];
  onboardingAnswers?: { day: number; question_key: string; answer: string | null }[];
  financialData?: Record<string, unknown> | null;
}) {
  const profileText =
    typeof dailyAnswers.profileText === "string" ? dailyAnswers.profileText : null;
  const daysFromState = Array.isArray(dailyAnswers.daysCompleted)
    ? (dailyAnswers.daysCompleted as number[])
    : [];
  const daysCompleted =
    daysFromState.length > 0 ? daysFromState : daysCompletedOverride;

  const flat = flattenDailyAnswers(dailyAnswers, {
    onboardingAnswers,
    financialData,
  });

  // group by day
  const byDay: Record<number, { key: string; value: unknown }[]> = {};
  for (const [key, val] of Object.entries(flat)) {
    const meta = QUESTION_MAP[key];
    const day = meta?.day ?? 0;
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push({ key, value: val });
  }
  const sortedDays = Object.keys(byDay)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5">
      <h2 className="font-semibold">
        שאלון אפיון
        {daysCompleted.length > 0 && (
          <span className="mr-2 text-sm font-normal text-[var(--muted)]">
            {daysCompleted.length}/7 ימים הושלמו
          </span>
        )}
      </h2>

      {profileText && (
        <div className="rounded-lg bg-black/20 px-4 py-3 text-sm leading-relaxed border border-[var(--border)]/40">
          <p className="mb-1 text-xs font-semibold text-[var(--muted)]">סיכום AI — פרופיל שנוצר</p>
          <p className="text-[var(--text)]">{profileText}</p>
        </div>
      )}

      {sortedDays.map((day) => {
        const dayInfo = DAY_META[day];
        const questions = byDay[day];
        // sort by question order in QUESTION_MAP (by day key order)
        const sortedQ = [...questions].sort((a, b) => {
          const keys = Object.keys(QUESTION_MAP);
          return keys.indexOf(a.key) - keys.indexOf(b.key);
        });
        return (
          <div key={day} className="space-y-2">
            <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
              {dayInfo ? `יום ${day} — ${dayInfo.icon} ${dayInfo.topic}` : `יום ${day}`}
            </p>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {sortedQ.map(({ key, value }) => {
                const meta = QUESTION_MAP[key];
                return (
                  <Item
                    key={key}
                    label={meta?.label ?? key}
                    value={formatAnswer(key, value)}
                  />
                );
              })}
            </dl>
          </div>
        );
      })}

      {sortedDays.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          {daysCompleted.length > 0
            ? "ימים סומנו כהושלמו אך טקסט התשובות לא נמשך — לחץ «רענן מהאפליקציה» בראש הכרטיס."
            : "אין תשובות עדיין"}
        </p>
      )}
    </section>
  );
}
