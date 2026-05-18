import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAgentRunDetail } from "@/lib/ai/operations-queries";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  START: "התחלה",
  ROUTE: "ניתוב",
  CONTEXT: "הקשר",
  LLM: "מודל שפה",
  IMAGE: "תמונה",
  PREP: "הכנה",
  JOB: "משימות",
  COMPLETE: "סיום",
  ERROR: "שגיאה",
};

export default async function AiRunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "CEO") redirect("/unauthorized");

  const { id } = await params;
  const run = await getAgentRunDetail(id);
  if (!run) notFound();

  return (
    <div className="space-y-6" dir="rtl">
      <Link
        href="/ceo/ai-operations"
        className="text-sm text-[var(--accent)] hover:underline"
      >
        ← חזרה ליומן AI
      </Link>

      <header className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h1 className="text-xl font-bold">{run.agentTitle}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {new Date(run.startedAt).toLocaleString("he-IL")}
          {run.finishedAt && ` — ${new Date(run.finishedAt).toLocaleString("he-IL")}`}
        </p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Item label="סטטוס" value={run.status} />
          <Item label="מפעיל" value={run.trigger} />
          <Item label="ספק / מודל" value={`${run.provider}${run.model ? ` · ${run.model}` : ""}`} />
          <Item label="עלות משוערת" value={run.costLabel} />
          <Item label="טוקנים (קלט)" value={String(run.inputTokens)} />
          <Item label="טוקנים (פלט)" value={String(run.outputTokens)} />
          <Item label="שלבים" value={String(run.stepCount)} />
        </dl>
        {run.error && (
          <p className="mt-3 rounded-lg bg-red-950/30 px-3 py-2 text-sm text-red-200">{run.error}</p>
        )}
      </header>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-2 font-semibold">קלט למערכת</h2>
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-xs">
          {run.input}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">שלבים — מה נעשה ולמה</h2>
        {run.steps.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">אין שלבים מתועדים (ריצה ישנה לפני התיעוד).</p>
        ) : (
          run.steps.map((step) => (
            <article
              key={step.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[var(--accent-dim)]/50 px-2 py-0.5 text-xs font-mono">
                  #{step.stepIndex + 1}
                </span>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">
                  {KIND_LABELS[step.kind] ?? step.kind}
                </span>
                <h3 className="font-medium">{step.title}</h3>
                {step.costUsd > 0 && (
                  <span className="mr-auto text-xs text-amber-200">{step.costLabel}</span>
                )}
              </div>

              <p className="mt-3 rounded-lg border border-[var(--border)]/50 bg-black/20 p-3 text-sm leading-relaxed">
                <span className="font-medium text-[var(--accent)]">למה: </span>
                {step.rationale}
              </p>

              {(step.provider || step.model) && (
                <p className="mt-2 text-xs text-[var(--muted)]">
                  מודל: {step.provider}
                  {step.model ? ` · ${step.model}` : ""}
                  {(step.inputTokens > 0 || step.outputTokens > 0) &&
                    ` · טוקנים ${step.inputTokens}→${step.outputTokens}`}
                </p>
              )}

              {step.inputPreview && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-[var(--muted)]">קלט לשלב</summary>
                  <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-xs">
                    {step.inputPreview}
                  </pre>
                </details>
              )}

              {step.outputPreview && (
                <details className="mt-2" open={step.kind === "LLM"}>
                  <summary className="cursor-pointer text-xs text-[var(--muted)]">פלט / תוצאה</summary>
                  <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-xs">
                    {step.outputPreview}
                  </pre>
                </details>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
