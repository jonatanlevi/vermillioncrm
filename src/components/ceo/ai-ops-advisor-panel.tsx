"use client";

import Link from "next/link";
import { useState } from "react";

const EXAMPLES = [
  "כמה אנחנו מוציאים על AI החודש ומה התחזית לסוף חודש?",
  "איך להוזיל את סוכן מוצר VerMillion?",
  "מה עולה יותר — CRM או AI Coach באפליקציה?",
  "אילו ריצות הכי יקרות ומה לעשות?",
];

export function AiOpsAdvisorPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ceo/ai-operations/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה");
      setResult(data.message ?? "");
      if (typeof data.runId === "string") setLastRunId(data.runId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-violet-800/50 bg-violet-950/20 p-5">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-violet-200">יועץ עלויות AI</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          מספרים מחושבים בקוד מתיעוד הריצות — לא ניחוש. שאל על CRM, אפליקציה, חיסכון ושליטה.
        </p>
      </header>

      <div className="mb-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setInput(ex)}
            className="rounded-lg border border-[var(--border)] bg-black/20 px-2 py-1 text-xs text-[var(--muted)] hover:border-violet-600 hover:text-white"
          >
            {ex.slice(0, 42)}…
          </button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        placeholder="למשל: איך להוזיל? כמה נשאר עד סוף החודש? מי הסוכן הכי יקר?"
        className="w-full rounded-lg border border-[var(--border)] bg-black/30 px-3 py-2 text-sm"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void ask()}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "מנתח…" : "שאל את היועץ"}
        </button>
        {lastRunId && (
          <Link
            href={`/ceo/ai-operations/${lastRunId}`}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            פירוט ריצה →
          </Link>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {result && (
        <pre className="mt-4 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-4 text-sm leading-relaxed text-zinc-200">
          {result}
        </pre>
      )}
    </section>
  );
}
