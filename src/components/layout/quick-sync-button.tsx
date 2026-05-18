"use client";

import { useState } from "react";
import { useVermillionSync } from "./vermillion-sync-poller";

export function QuickSyncButton({ disabled }: { disabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const sync = useVermillionSync();

  async function runSync() {
    setLoading(true);
    try {
      await fetch("/api/app/sync", { method: "POST" });
      await sync?.pollNow();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={runSync}
      disabled={disabled || loading}
      className="shrink-0 rounded-md border border-[var(--border)] bg-white/5 px-2.5 py-1 text-xs hover:bg-white/10 disabled:opacity-40"
    >
      {loading ? "מסנכרן…" : "סנכרן מ-Supabase"}
    </button>
  );
}
