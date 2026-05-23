"use client";

import { useState } from "react";
import { useVermillionSync } from "./vermillion-sync-poller";

export function QuickSyncButton({ disabled }: { disabled: boolean }) {
  const [state, setState] = useState<"idle" | "syncing" | "reloading" | "done">("idle");
  const sync = useVermillionSync();

  async function runSync() {
    setState("syncing");
    try {
      await fetch("/api/app/sync", { method: "POST" });
      await sync?.pollNow();
      setState("reloading");
      await new Promise(r => setTimeout(r, 600));
      window.location.reload();
    } catch {
      setState("idle");
    }
  }

  const isLoading = state === "syncing" || state === "reloading";

  return (
    <button
      type="button"
      onClick={runSync}
      disabled={disabled || isLoading}
      className={`
        group relative shrink-0 flex items-center gap-2
        rounded-lg border px-3.5 py-1.5 text-xs font-semibold
        transition-all duration-200
        ${disabled
          ? "border-[var(--border)] bg-white/3 text-[var(--muted)] opacity-40 cursor-not-allowed"
          : isLoading
          ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] cursor-wait"
          : "border-[var(--accent)]/30 bg-[var(--accent)]/8 text-white hover:bg-[var(--accent)]/20 hover:border-[var(--accent)]/60 hover:shadow-[0_0_12px_rgba(185,28,28,0.15)] active:scale-95"
        }
      `}
    >
      {/* Icon */}
      <span
        className={`text-[var(--accent)] transition-transform duration-700 ${
          state === "syncing" ? "animate-spin" : state === "reloading" ? "animate-pulse" : "group-hover:rotate-180"
        }`}
        style={{ display: "inline-block" }}
      >
        {state === "reloading" ? "⟳" : "↻"}
      </span>

      {/* Label */}
      <span>
        {state === "syncing"
          ? "מסנכרן…"
          : state === "reloading"
          ? "טוען מחדש…"
          : "סנכרן מ-Supabase"}
      </span>

      {/* Subtle glow on hover */}
      {!disabled && !isLoading && (
        <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ring-1 ring-[var(--accent)]/20" />
      )}
    </button>
  );
}
