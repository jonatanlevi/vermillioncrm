"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryRunButton({ runId }: { runId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${runId}/retry`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "שגיאה בניסיון חוזר");
      } else {
        router.refresh();
      }
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={handleRetry}
        disabled={loading}
        className="rounded border border-[var(--accent)]/40 px-2 py-0.5 text-xs text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50"
      >
        {loading ? "מנסה…" : "נסה שנית ↺"}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </span>
  );
}
