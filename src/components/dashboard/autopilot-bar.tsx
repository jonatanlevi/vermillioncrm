"use client";

import { useState } from "react";

export function AutopilotBar() {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runPipeline() {
    if (!instruction.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.message ?? "הושלם");
    } catch (e) {
      setResult(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-dim)]/20 p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-sm text-[var(--accent)]">&lt;/&gt;</span>
        <h2 className="font-semibold">פקודה אסטרטגית</h2>
      </div>
      <p className="mb-3 text-sm text-[var(--muted)]">
        תאר יעד עסקי — המערכת תפעיל שיווק, מכירות, כספים ומדיה ברצף
      </p>
      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        dir="rtl"
        rows={2}
        placeholder="לדוגמה: קמפיין השקה ל-Instagram ו-TikTok, דוח שבועי למנכ״ל, ומסר לידים חמים בוואטסאפ"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={runPipeline}
        disabled={loading}
        className="mt-3 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "מבצע…" : "בצע פקודה"}
      </button>
      {result && (
        <p className="mt-3 text-sm" dir="rtl">
          {result}
        </p>
      )}
    </div>
  );
}
