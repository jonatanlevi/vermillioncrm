import Link from "next/link";
import { getVermillionDashboard } from "@/lib/vermillion/queries";
import { IngestionGate } from "./ingestion-gate";

function formatMoney(n: number) {
  return `₪${n.toLocaleString("he-IL")}`;
}

export async function VermillionDashboard() {
  const data = await getVermillionDashboard();

  const { totals, prizePool, topStampers, recentUsers, monthKey } = data;

  return (
    <IngestionGate>
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">מוצר VerMillion</h2>
          <p className="text-sm text-[var(--muted)]">
            חודש: {monthKey} · עותק מקומי (עודכן בסנכרון האחרון)
          </p>
        </div>
        <Link
          href="/vermillion/users"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
        >
          כל המשתמשים →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="משתמשים" value={String(totals.users)} />
        <Stat label="פרימיום" value={String(totals.premium)} sub={`${totals.free} חינם`} />
        <Stat
          label="הגדירו טיימר DNA"
          value={String(totals.withTimerSet)}
          sub="שעת Stamp יומית"
        />
        <Stat
          label="Stamps החודש"
          value={String(totals.totalStampsThisMonth)}
          sub={`${totals.stampedUsersThisMonth} משתמשים`}
        />
        <Stat label="סיימו אונבורדינג" value={String(totals.onboardingComplete)} />
        <Stat label="פרופיל מלא" value={String(totals.intakeComplete)} />
        <Stat label="ממוצע Streak" value={String(totals.avgStreak)} sub="ימים" />
        {prizePool && (
          <>
            <Stat
              label="הכנסה חודשית (הערכה)"
              value={formatMoney(prizePool.monthlyRevenue)}
              highlight
            />
            <Stat
              label="פרס שבועי (נטו)"
              value={formatMoney(prizePool.weeklyPrizeNet)}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-3 font-semibold">מובילי Stamp החודש</h3>
          {topStampers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">אין נתונים עדיין</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {topStampers.map((t, i) => (
                <li key={t.userId} className="flex justify-between gap-2">
                  <span>
                    {i + 1}. {t.name}
                  </span>
                  <span className="text-[var(--muted)]">
                    {t.stamps} ימים · {t.score} נק׳
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 overflow-x-auto">
          <h3 className="mb-3 font-semibold">משתמשים אחרונים</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="pb-2 text-right">שם</th>
                <th className="pb-2 text-right">מנוי</th>
                <th className="pb-2 text-right">טיימר</th>
                <th className="pb-2 text-right">Stamps</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-[var(--border)]/40">
                  <td className="py-2">
                    <Link
                      href={`/vermillion/users/${u.id}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      {u.name || u.email || u.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-2">{u.subscription}</td>
                  <td className="py-2 font-mono">{u.timerDisplay ?? "—"}</td>
                  <td className="py-2">{u.stampsThisMonth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </IngestionGate>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-[var(--accent)]/40 bg-[var(--accent-dim)]/20"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}
