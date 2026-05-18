import { db } from "@/lib/db";

export async function StatsCards() {
  const [customers, campaigns, salesOpen, income, expenses, jobsQueued] =
    await Promise.all([
      db.customer.count(),
      db.campaign.count({ where: { status: "ACTIVE" } }),
      db.sale.count({ where: { status: { notIn: ["WON", "LOST"] } } }),
      db.transaction.aggregate({
        where: { type: "INCOME" },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: "EXPENSE" },
        _sum: { amount: true },
      }),
      db.automationJob.count({ where: { status: "QUEUED" } }),
    ]);

  const cards = [
    { label: "לקוחות", value: customers },
    { label: "קמפיינים פעילים", value: campaigns },
    { label: "עסקאות בצינור", value: salesOpen },
    { label: "הכנסות", value: `₪${(income._sum.amount ?? 0).toLocaleString("he-IL")}` },
    { label: "הוצאות", value: `₪${(expenses._sum.amount ?? 0).toLocaleString("he-IL")}` },
    { label: "משימות בתור", value: jobsQueued },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <p className="text-xs text-[var(--muted)]">{c.label}</p>
          <p className="mt-1 text-2xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
