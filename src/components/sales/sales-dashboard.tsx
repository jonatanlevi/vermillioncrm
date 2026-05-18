import { getSalesDashboardData } from "@/lib/sales/metrics";

function formatMoney(n: number) {
  return `₪${n.toLocaleString("he-IL", { maximumFractionDigits: 0 })}`;
}

function formatPct(n: number) {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export async function SalesDashboard() {
  const data = await getSalesDashboardData();
  const { kpis, pipeline, recentSales, staleLeads } = data;
  const maxPipeline = Math.max(...pipeline.map((p) => p.value), 1);

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-bold">דשבורד מכירות</h2>
        <p className="text-sm text-[var(--muted)]">
          כל הנתונים שעסק צריך — הכנסות, צינור, המרות ומעקב
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="הכנסות החודש"
          value={formatMoney(kpis.revenueThisMonth)}
          sub={`${formatPct(kpis.revenueGrowth)} לעומת חודש קודם`}
          highlight
        />
        <KpiCard label="שווי צינור פתוח" value={formatMoney(kpis.pipelineValue)} sub={`${kpis.openDeals} עסקאות פתוחות`} />
        <KpiCard label="אחוז סגירה" value={`${kpis.winRate.toFixed(1)}%`} sub={`${kpis.dealsWonMonth} נסגרו החודש`} />
        <KpiCard label="ממוצע עסקה" value={formatMoney(kpis.avgDealSize)} sub={`סה״כ ${formatMoney(kpis.totalRevenue)}`} />
        <KpiCard label="לקוחות" value={String(kpis.customersCount)} sub={`${kpis.newCustomersMonth} חדשים החודש`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 font-semibold">צינור מכירות</h3>
          <div className="space-y-3">
            {pipeline.map((stage) => (
              <div key={stage.status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{stage.label}</span>
                  <span className="text-[var(--muted)]">
                    {stage.count} · {formatMoney(stage.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all"
                    style={{ width: `${Math.max((stage.value / maxPipeline) * 100, stage.count > 0 ? 8 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-4 font-semibold">משפך המרה</h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {pipeline.slice(0, 4).map((stage) => {
              const maxCount = Math.max(...pipeline.map((p) => p.count), 1);
              const h = (stage.count / maxCount) * 100;
              return (
                <div key={stage.status} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-[var(--accent)]/80"
                    style={{ height: `${Math.max(h, 4)}%` }}
                    title={`${stage.count} עסקאות`}
                  />
                  <span className="text-center text-[10px] text-[var(--muted)] leading-tight">
                    {stage.label}
                  </span>
                  <span className="text-xs font-medium">{stage.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <h3 className="mb-3 font-semibold">עסקאות אחרונות</h3>
          {recentSales.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">אין עסקאות עדיין</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="pb-2 text-right font-medium">עסקה</th>
                  <th className="pb-2 text-right font-medium">לקוח</th>
                  <th className="pb-2 text-right font-medium">סכום</th>
                  <th className="pb-2 text-right font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--border)]/50">
                    <td className="py-2">{s.title}</td>
                    <td className="py-2 text-[var(--muted)]">{s.customerName ?? "—"}</td>
                    <td className="py-2">{formatMoney(s.amount)}</td>
                    <td className="py-2">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-5">
          <h3 className="mb-3 font-semibold text-amber-200">דורש מעקב</h3>
          <p className="mb-3 text-xs text-[var(--muted)]">לידים ללא עדכון מעל 7 ימים</p>
          {staleLeads.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">אין לידים תקועים 🎉</p>
          ) : (
            <ul className="space-y-2">
              {staleLeads.map((s) => (
                <li
                  key={s.id}
                  className="flex justify-between rounded-lg border border-amber-900/30 bg-black/20 px-3 py-2 text-sm"
                >
                  <span>{s.title}</span>
                  <span className="text-[var(--muted)]">{formatMoney(s.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-[var(--accent)]/50 bg-[var(--accent-dim)]/30"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    LEAD: "bg-zinc-700",
    QUALIFIED: "bg-blue-900",
    PROPOSAL: "bg-amber-900",
    WON: "bg-green-900",
    LOST: "bg-red-900",
  };
  const labels: Record<string, string> = {
    LEAD: "ליד",
    QUALIFIED: "מוסמך",
    PROPOSAL: "הצעה",
    WON: "נסגר",
    LOST: "הפסד",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs ${colors[status] ?? "bg-zinc-800"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
