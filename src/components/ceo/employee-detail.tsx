import Link from "next/link";
import { getEmployeeDetail } from "@/lib/ceo/queries";
import { actionLabel, roleLabel, statusLabel } from "@/lib/ceo/constants";

const METRIC_LABELS: Record<string, string> = {
  deals_closed: "עסקאות שנסגרו",
  sales_amount: "סכום מכירות (₪)",
  campaigns: "קמפיינים",
  whatsapp_sent: "הודעות וואטסאפ",
};

export async function EmployeeDetail({ id }: { id: string }) {
  const employee = await getEmployeeDetail(id);

  if (!employee) {
    return (
      <p className="text-[var(--muted)]">
        עובד לא נמצא. <Link href="/ceo/team">חזרה לצוות</Link>
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/ceo/team" className="text-[var(--accent)] hover:underline">
          ← חזרה לצוות
        </Link>
        <Link href="/ceo/attendance" className="text-[var(--accent)] hover:underline">
          יומן נוכחות
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-bold">{employee.name}</h1>
        <p className="text-sm text-[var(--muted)]">
          {roleLabel(employee.role)} · {employee.department ?? "ללא מחלקה"} ·{" "}
          {statusLabel(employee.status)}
        </p>
        <p className="text-sm text-[var(--muted)]">{employee.email}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="עסקאות שנסגרו החודש"
          value={String(employee.stats.wonDealsMonth)}
        />
        <StatCard
          title="סכום מכירות"
          value={`₪${employee.stats.salesAmountMonth.toLocaleString("he-IL")}`}
        />
        <StatCard
          title="פעולות AI"
          value={String(employee.stats.agentRunsMonth)}
        />
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-3 font-semibold">יעדים חודשיים</h2>
        {employee.goals.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">לא הוגדרו יעדים</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {employee.goals.map((g) => {
              const pct =
                g.targetValue > 0
                  ? Math.round((g.actualValue / g.targetValue) * 100)
                  : 0;
              return (
                <li key={g.id} className="flex justify-between gap-2">
                  <span>{METRIC_LABELS[g.metric] ?? g.metric}</span>
                  <span>
                    {g.actualValue} / {g.targetValue} ({pct}%)
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-3 font-semibold">פעילות אחרונה</h2>
        <ul className="space-y-2 text-sm">
          {employee.activities.map((a) => (
            <li key={a.id} className="flex justify-between gap-2">
              <span>{actionLabel(a.action)}</span>
              <span className="text-xs text-[var(--muted)]">
                {a.createdAt.toLocaleString("he-IL")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {employee.sales.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <h2 className="mb-3 font-semibold">עסקאות</h2>
          <ul className="space-y-1 text-sm">
            {employee.sales.map((s) => (
              <li key={s.id}>
                {s.title} — ₪{s.amount.toLocaleString("he-IL")} ({s.status})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-xs text-[var(--muted)]">{title}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}
