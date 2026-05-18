import Link from "next/link";
import { getVermillionUserDetail, formatTimer } from "@/lib/vermillion/queries";
import { IngestionGate } from "./ingestion-gate";

export async function VermillionUserDetail({ userId }: { userId: string }) {
  const user = await getVermillionUserDetail(userId);

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
    <div className="space-y-6">
      <Link href="/vermillion/users" className="text-sm text-[var(--accent)] hover:underline">
        ← חזרה לכל המשתמשים
      </Link>

      <header>
        <h1 className="text-2xl font-bold">{user.name || user.email}</h1>
        <p className="text-sm text-[var(--muted)]">{user.id}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="מנוי" value={user.subscription} />
        <Card title="טיימר DNA" value={user.timerDisplay ?? "לא הוגדר"} mono />
        <Card title="Streak" value={String(c?.streak_days ?? 0)} />
        <Card title="Stamps החודש" value={String(user.stampsThisMonth)} />
        <Card title="ניקוד החודש" value={String(user.totalScoreThisMonth)} />
        <Card title="משחקים" value={String(user.game_sessions_count)} />
        <Card title="הודעות AI" value={String(user.chatMessageCount)} />
        <Card title="V-Coins" value={String(user.v_coins ?? 0)} />
        <Card title="אזור זמן" value={user.timezone ?? "UTC"} />
      </div>

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
          <Item label="פרופיל מלא" value={user.profile_intake_complete ? "כן" : "לא"} />
          <Item
            label="הצטרף"
            value={new Date(user.joined_at).toLocaleDateString("he-IL")}
          />
        </dl>
      </section>

      {user.onboarding_answers.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-3 font-semibold">תשובות אונבורדינג</h2>
          <ul className="space-y-2 text-sm">
            {user.onboarding_answers.map((a, i) => (
              <li key={i} className="border-b border-[var(--border)]/40 pb-2">
                <span className="text-[var(--muted)]">
                  יום {a.day} · {a.question_key}:
                </span>{" "}
                {a.answer}
              </li>
            ))}
          </ul>
        </section>
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
