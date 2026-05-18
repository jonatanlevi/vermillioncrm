"use client";

import Link from "next/link";
import { useState } from "react";
import type { AgentId } from "@/lib/types/agents";
import { AGENT_META } from "@/lib/types/agents";

interface AgentPanelProps {
  agentId: AgentId;
  placeholder?: string;
  title?: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
  compact?: boolean;
}

export function AgentPanel({
  agentId,
  placeholder,
  title,
  subtitle,
  metadata,
  compact,
}: AgentPanelProps) {
  const meta = AGENT_META[agentId];
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(auto = false) {
    if (!input.trim() && !auto) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          input: input.trim() || "בצע משימת ברירת מחדל למודול זה",
          metadata: { ...metadata, ...(auto ? { auto: true } : {}) },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "שגיאה");
      setResult(data.message ?? JSON.stringify(data, null, 2));
      if (typeof data.runId === "string") setLastRunId(data.runId);
      if (agentId === "campaigns" && metadata?.network) {
        window.dispatchEvent(
          new CustomEvent("cha:campaign-updated", {
            detail: { network: metadata.network },
          })
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <header>
          <h1 className="text-2xl font-bold">{title ?? meta.titleHe}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {subtitle ?? meta.description}
          </p>
        </header>
      )}
      {compact && title ? <h3 className="text-sm font-semibold">{title}</h3> : null}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder ?? "תאר יעד עסקי — המערכת תבצע ותדווח"}
          dir="rtl"
          rows={4}
          className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => run(false)}
            disabled={loading}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "מבצע…" : "בצע"}
          </button>
          <button
            type="button"
            onClick={() => run(true)}
            disabled={loading}
            className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] disabled:opacity-50"
          >
            בצע ברצף מלא
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {result && (
        <div className="space-y-2">
          <div
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm whitespace-pre-wrap"
            dir="rtl"
          >
            {result}
          </div>
          {lastRunId && (
            <Link
              href={`/ceo/ai-operations/${lastRunId}`}
              className="inline-block text-xs text-[var(--accent)] hover:underline"
            >
              צפה בתיעוד מלא ועלות הריצה →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
