import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getAgentCostSummaries,
  getRecentAgentRuns,
  getTotalAiCost,
} from "@/lib/ai/operations-queries";

export const dynamic = "force-dynamic";

export default async function AiOperationsPage() {
  const session = await auth();
  if (session?.user?.role !== "CEO") redirect("/unauthorized");

  const [total, byAgent, runs] = await Promise.all([
    getTotalAiCost(),
    getAgentCostSummaries(),
    getRecentAgentRuns(80),
  ]);

  return (
    <div className="space-y-8" dir="rtl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">מרכז AI — תיעוד ועלויות</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            כל פעולת סוכן ומודל נרשמת עם הסבר לכל שלב: מה נעשה, למה, איזה מודל, כמה
            טוקנים ועלות משוערת. העלויות הן הערכה לפי מחירון — לא חיוב בפועל.
          </p>
        </div>
        <Link href="/ceo" className="text-sm text-[var(--accent)] hover:underline">
          ← מרכז מנכ״ל
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--muted)]">סה״כ עלות משוערת</p>
          <p className="mt-1 text-2xl font-bold text-amber-200">{total.costLabel}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--muted)]">ריצות AI</p>
          <p className="mt-1 text-2xl font-bold">{total.runCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--muted)]">סוכנים פעילים</p>
          <p className="mt-1 text-2xl font-bold">{byAgent.length}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">עלות לפי סוכן</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="px-4 py-3 text-right">סוכן</th>
                <th className="px-4 py-3 text-right">ריצות</th>
                <th className="px-4 py-3 text-right">עלות משוערת</th>
              </tr>
            </thead>
            <tbody>
              {byAgent.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-[var(--muted)]">
                    עדיין אין ריצות AI מתועדות — הפעל סוכן מכל מודול.
                  </td>
                </tr>
              ) : (
                byAgent.map((a) => (
                  <tr key={a.agentId} className="border-b border-[var(--border)]/40">
                    <td className="px-4 py-2 font-medium">{a.agentTitle}</td>
                    <td className="px-4 py-2">{a.runCount}</td>
                    <td className="px-4 py-2 text-amber-200">{a.costLabel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">יומן ריצות אחרונות</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="px-3 py-3 text-right">זמן</th>
                <th className="px-3 py-3 text-right">סוכן</th>
                <th className="px-3 py-3 text-right">מודל</th>
                <th className="px-3 py-3 text-right">שלבים</th>
                <th className="px-3 py-3 text-right">עלות</th>
                <th className="px-3 py-3 text-right">סטטוס</th>
                <th className="px-3 py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border)]/40 hover:bg-white/5">
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--muted)]">
                    {new Date(r.startedAt).toLocaleString("he-IL")}
                  </td>
                  <td className="px-3 py-2">{r.agentTitle}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.provider}
                    {r.model ? ` · ${r.model}` : ""}
                  </td>
                  <td className="px-3 py-2">{r.stepCount}</td>
                  <td className="px-3 py-2 text-amber-200">{r.costLabel}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/ceo/ai-operations/${r.id}`}
                      className="text-[var(--accent)] hover:underline"
                    >
                      פירוט →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "COMPLETED"
      ? "bg-emerald-900/40 text-emerald-200"
      : status === "FAILED"
        ? "bg-red-900/40 text-red-200"
        : status === "RUNNING"
          ? "bg-amber-900/40 text-amber-200"
          : "bg-zinc-800 text-zinc-300";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colors}`}>{status}</span>
  );
}
