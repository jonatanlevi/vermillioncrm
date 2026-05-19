"use client";

import { useState } from "react";

type CalcResponse = {
  ok: boolean;
  markdown?: string;
  error?: string;
};

export function PrizeCalculatorWidget() {
  const [subscribers, setSubscribers] = useState("100");
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function calculate() {
    const n = parseInt(subscribers.replace(/,/g, ""), 10);
    if (!Number.isFinite(n) || n < 0) {
      setError("הזן מספר מנויים תקין");
      return;
    }
    setLoading(true);
    setError(null);
    setMarkdown(null);
    try {
      const res = await fetch(
        `/api/vermillion/prize-calculator?subscribers=${n}&hypothetical=true`
      );
      const data = (await res.json()) as CalcResponse;
      if (!res.ok) throw new Error(data.error ?? "שגיאה");
      setMarkdown(data.markdown ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-[var(--accent)]/40 bg-[var(--surface)] p-5">
      <h2 className="mb-1 font-semibold text-[var(--accent)]">מחשבון פרסים רשמי</h2>
      <p className="mb-4 text-sm text-[var(--muted)]">
        חישוב בקוד בלבד — זהה ללוגיקת האפליקציה (prize-pool). לא AI.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--muted)]">מנויי premium פעילים</span>
          <input
            type="number"
            min={0}
            value={subscribers}
            onChange={(e) => setSubscribers(e.target.value)}
            className="w-32 rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => void calculate()}
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "מחשב…" : "חשב פרסים"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {markdown && (
        <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-black/30 p-4 text-sm leading-relaxed text-[var(--muted)]">
          {markdown}
        </pre>
      )}
    </section>
  );
}
