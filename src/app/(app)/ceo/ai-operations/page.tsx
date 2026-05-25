import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AiOpsAdvisorPanel } from "@/components/ceo/ai-ops-advisor-panel";
import { RetryRunButton } from "@/components/ceo/retry-run-button";
import {
  getAgentCostSummaries,
  getRecentAgentRuns,
  getTotalAiCost,
  getAppCostSummaries,
  getRecentAppCosts,
} from "@/lib/ai/operations-queries";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  groq_api:  "Groq API — AI Coach",
  vercel:    "Vercel Hosting",
  supabase:  "Supabase DB",
  other:     "אחר",
};

export default async function AiOperationsPage() {
  const session = await auth();
  if (session?.user?.role !== "CEO") redirect("/unauthorized");

  const [total, byAgent, runs, appSummaries, recentAppCosts] = await Promise.all([
    getTotalAiCost(),
    getAgentCostSummaries(),
    getRecentAgentRuns(60),
    getAppCostSummaries(),
    getRecentAppCosts(40),
  ]);

  const appTotalIls = appSummaries.reduce((s, r) => s + r.totalIls, 0);

  return (
    <div className="space-y-8" dir="rtl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">מרכז AI — תיעוד ועלויות</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            כל עלות AI — CRM + אפליקציה — מחושבת כאן. העלויות מנוכות מקופת הפרסים.
          </p>
        </div>
        <Link href="/ceo" className="text-sm text-[var(--accent)] hover:underline">
          ← מרכז מנכ״ל
        </Link>
      </header>

      {/* כרטיסי סיכום */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--muted)]">סה״כ עלות AI — החודש</p>
          <p className="mt-1 text-2xl font-bold text-amber-200">
            ₪{total.totalCostIls.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--muted)]">אפליקציה — AI Coach (החודש)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-300">
            ₪{appTotalIls.toFixed(2)}
          </p>
          <p className="text-xs text-[var(--muted)]">{total.appCostCount} שיחות</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--muted)]">CRM Agents — סה״כ</p>
          <p className="mt-1 text-2xl font-bold text-sky-300">{total.crmCostLabel}</p>
          <p className="text-xs text-[var(--muted)]">{total.crmRunCount} ריצות</p>
        </div>
        <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4">
          <p className="text-xs text-amber-300/70">השפעה על קופת פרסים</p>
          <p className="mt-1 text-sm font-semibold text-amber-200">
            עלות AI מנוכה מהכנסות לפני חישוב הפרס
          </p>
          <Link href="/vermillion" className="mt-1 block text-xs text-[var(--accent)] hover:underline">
            ← ראה חישוב פרס מלא
          </Link>
        </div>
      </section>

      <AiOpsAdvisorPanel />

      {/* עלויות אפליקציה לפי קטגוריה */}
      {appSummaries.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">עלויות אפליקציה — החודש</h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="px-4 py-3 text-right">קטגוריה</th>
                  <th className="px-4 py-3 text-right">רשומות</th>
                  <th className="px-4 py-3 text-right">עלות (₪)</th>
                </tr>
              </thead>
              <tbody>
                {appSummaries.map((r) => (
                  <tr key={r.category} className="border-b border-[var(--border)]/40">
                    <td className="px-4 py-2 font-medium">
                      {CATEGORY_LABEL[r.category] ?? r.category}
                    </td>
                    <td className="px-4 py-2">{r.count}</td>
                    <td className="px-4 py-2 text-emerald-300">₪{r.totalIls.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* יומן עלויות אפליקציה */}
      {recentAppCosts.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">יומן עלויות אפליקציה</h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                  <th className="px-3 py-3 text-right">זמן</th>
                  <th className="px-3 py-3 text-right">קטגוריה</th>
                  <th className="px-3 py-3 text-right">תיאור</th>
                  <th className="px-3 py-3 text-right">עלות (₪)</th>
                </tr>
              </thead>
              <tbody>
                {recentAppCosts.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border)]/40">
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-[var(--muted)]">
                      {new Date(c.sourceAt).toLocaleString("he-IL")}
                    </td>
                    <td className="px-3 py-2">
                      {CATEGORY_LABEL[c.category] ?? c.category}
                    </td>
                    <td className="px-3 py-2 text-xs text-[var(--muted)]">
                      {c.description ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-emerald-300">
                      ₪{Number(c.amountIls).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {appSummaries.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--muted)]">
          {`אין עדיין עלויות אפליקציה מסונכרנות — לחץ על "סנכרן נתונים" בלוח הבקרה של VerMillion.`}
        </div>
      )}

      {/* CRM Agents — עלות לפי סוכן */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">CRM Agents — עלות לפי סוכן</h2>
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
                    <td className="px-4 py-2 text-sky-300">{a.costLabel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CRM Agents — יומן ריצות */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">CRM Agents — יומן ריצות אחרונות</h2>
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
                    {r.provider}{r.model ? ` · ${r.model}` : ""}
                  </td>
                  <td className="px-3 py-2">{r.stepCount}</td>
                  <td className="px-3 py-2 text-sky-300">{r.costLabel}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {r.status === "FAILED" && <RetryRunButton runId={r.id} />}
                      <Link
                        href={`/ceo/ai-operations/${r.id}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        פירוט →
                      </Link>
                    </div>
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
