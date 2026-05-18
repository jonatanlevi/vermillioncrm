import Link from "next/link";
import { PrismaEmployeeModelsMissingError } from "@/lib/ceo/db-access";
import { getCeoDashboard } from "@/lib/ceo/queries";
import { actionLabel, roleLabel, statusLabel } from "@/lib/ceo/constants";
import { PrismaSetupBanner } from "./prisma-setup-banner";

function formatMoney(n: number) {
  return `₪${n.toLocaleString("he-IL")}`;
}

export async function CeoDashboard() {
  let data;
  try {
    data = await getCeoDashboard();
  } catch (e) {
    if (e instanceof PrismaEmployeeModelsMissingError) {
      return <PrismaSetupBanner />;
    }
    throw e;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">מרכז מנכ״ל</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            ביצועי צוות, יעדים ונוכחות — עובדים פנימיים בלבד · חודש {data.monthKey}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/ceo/team"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-white/5"
          >
            כל העובדים
          </Link>
          <Link
            href="/ceo/team/new"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
          >
            + עובד חדש
          </Link>
          <Link
            href="/ceo/attendance"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-white/5"
          >
            יומן נוכחות
          </Link>
          <Link
            href="/ceo/activity"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-white/5"
          >
            יומן פעילות
          </Link>
          <Link
            href="/ceo/approvals"
            className="rounded-lg border border-amber-700/50 px-4 py-2 text-sm text-amber-200 hover:bg-amber-950/30"
          >
            אישור הרשמות
          </Link>
        </div>
      </header>

      <section
        className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-dim)]/10 p-5"
        dir="rtl"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">מוצר VerMillion (נתונים אמיתיים)</h2>
            <p className="text-xs text-[var(--muted)]">
              מ-AppUser / AppSyncMeta · סנכרון אחרון:{" "}
              {data.product.lastSyncAt
                ? new Date(data.product.lastSyncAt).toLocaleString("he-IL")
                : "טרם סונכרן"}{" "}
              · סטטוס: {data.product.lastSyncStatus}
            </p>
          </div>
          <Link
            href="/vermillion/users"
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white"
          >
            כל המשתמשים →
          </Link>
        </div>
        {data.product.configured ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="משתמשים במאגר" value={String(data.product.users)} />
            <Kpi label="פרימיום" value={String(data.product.premium)} highlight />
            <Kpi label="Stamps החודש" value={String(data.product.totalStampsThisMonth)} />
            <Kpi label="ממוצע Streak" value={String(data.product.avgStreak)} />
            <Kpi label="הגדירו טיימר" value={String(data.product.withTimerSet)} />
            <Kpi label="סיימו אונבורדינג" value={String(data.product.onboardingComplete)} />
            <Kpi label="פעילים ב-Stamps" value={String(data.product.stampedUsersThisMonth)} />
            <Kpi label="חינם" value={String(data.product.free)} />
          </div>
        ) : (
          <p className="text-sm text-amber-200">
            אין נתוני מוצר במאגר המקומי.{" "}
            <Link href="/vermillion" className="underline">
              סנכרן מאפליקציה
            </Link>
          </p>
        )}
      </section>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--muted)]">תפעול פנימי (צוות ו-CRM)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="עובדים פעילים" value={String(data.activeEmployees)} />
          <Kpi label="עסקאות בצינור" value={String(data.openDeals)} />
          <Kpi label="נסגרו החודש" value={String(data.wonDealsMonth)} />
          <Kpi label="הכנסות החודש" value={formatMoney(data.salesAmountMonth)} highlight />
          <Kpi label="קמפיינים" value={String(data.campaignsMonth)} />
          <Kpi label="וואטסאפ יוצא" value={String(data.whatsappMonth)} />
          <Kpi label="פעולות AI (חודש)" value={String(data.agentRunsMonth)} />
        </div>
      </div>

      {data.alerts.length > 0 && (
        <section className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-4">
          <h2 className="mb-2 font-semibold text-amber-200">התראות מנכ״ל</h2>
          <ul className="space-y-1 text-sm">
            {data.alerts.map((a, i) => (
              <li key={i}>
                {a.href ? (
                  <Link href={a.href} className="text-amber-100 underline">
                    {a.message}
                  </Link>
                ) : a.employeeId ? (
                  <Link
                    href={`/ceo/team/${a.employeeId}`}
                    className="text-amber-100 underline"
                  >
                    {a.message}
                  </Link>
                ) : (
                  a.message
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <h2 className="border-b border-[var(--border)] px-4 py-3 font-semibold">
          ביצועי עובדים
        </h2>
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-[var(--muted)]">
              <th className="px-3 py-2 text-right">עובד</th>
              <th className="px-3 py-2 text-right">תפקיד</th>
              <th className="px-3 py-2 text-right">עסקאות</th>
              <th className="px-3 py-2 text-right">סכום</th>
              <th className="px-3 py-2 text-right">קמפיינים</th>
              <th className="px-3 py-2 text-right">וואטסאפ</th>
              <th className="px-3 py-2 text-right">פעולות AI</th>
              <th className="px-3 py-2 text-right">יעד %</th>
            </tr>
          </thead>
          <tbody>
            {data.team.map((row) => (
              <tr key={row.id} className="border-t border-[var(--border)]/40">
                <td className="px-3 py-2">
                  <Link
                    href={`/ceo/team/${row.id}`}
                    className="font-medium text-[var(--accent)] hover:underline"
                  >
                    {row.name}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">
                    {statusLabel(row.status)}
                  </p>
                </td>
                <td className="px-3 py-2">{roleLabel(row.role)}</td>
                <td className="px-3 py-2">
                  {row.openDeals} פתוחות · {row.wonDealsMonth} נסגרו
                </td>
                <td className="px-3 py-2">{formatMoney(row.salesAmountMonth)}</td>
                <td className="px-3 py-2">{row.campaigns}</td>
                <td className="px-3 py-2">{row.whatsappSent}</td>
                <td className="px-3 py-2">{row.agentRuns}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      row.goalPercent >= 80
                        ? "text-green-400"
                        : row.goalPercent < 50
                          ? "text-amber-300"
                          : ""
                    }
                  >
                    {row.goalPercent}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-3 font-semibold">פעילות אחרונה</h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">אין פעילות עדיין</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.recentActivity.map((a) => (
              <li key={a.id} className="flex justify-between gap-2">
                <span>
                  <strong>{a.employeeName}</strong> — {actionLabel(a.action)}
                </span>
                <span className="shrink-0 text-xs text-[var(--muted)]">
                  {a.createdAt.toLocaleString("he-IL")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
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
    </div>
  );
}
