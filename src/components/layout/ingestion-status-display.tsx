"use client";

import { usePathname } from "next/navigation";
import { useVermillionSync } from "./vermillion-sync-poller";

function StatusDot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  const color = ok ? "bg-emerald-500" : warn ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`} aria-hidden />;
}

function realtimeLabel(status: string, enabled: boolean, configured: boolean): string {
  if (!configured) return "לא זמין";
  if (!enabled) return "כבוי";
  switch (status) {
    case "live":
      return "פעיל";
    case "connecting":
      return "מתחבר…";
    case "error":
      return "שגיאה";
    case "off":
      return "מאתחל…";
    default:
      return "ממתין";
  }
}

export function IngestionStatusDisplay({
  initialConfigured,
  initialUserCount,
  initialLastSyncAt,
}: {
  initialConfigured: boolean;
  initialUserCount: number;
  initialLastSyncAt: string | null;
}) {
  const pathname = usePathname();
  const onVermillion = pathname.startsWith("/vermillion");
  const { data } = useVermillionSync() ?? { data: null };

  const configured = onVermillion
    ? (data?.ingestionConfigured ?? initialConfigured)
    : initialConfigured;
  const userCount = onVermillion ? (data?.userCount ?? initialUserCount) : initialUserCount;
  const lastSyncAt = onVermillion ? (data?.lastSyncAt ?? initialLastSyncAt) : initialLastSyncAt;
  const realtime = onVermillion ? data?.realtime : null;

  const label = realtime
    ? realtimeLabel(realtime.status, realtime.enabled, configured)
    : configured
      ? "—"
      : "לא זמין";
  const realtimeOk = Boolean(realtime?.enabled && realtime.status === "live");
  const realtimeWarn = Boolean(realtime?.enabled && !realtimeOk && realtime.status !== "error");

  const lastLabel = lastSyncAt
    ? new Date(lastSyncAt).toLocaleString("he-IL", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "טרם סונכרן";

  return (
    <>
      <span className="flex items-center gap-1.5 text-[var(--muted)]">
        <StatusDot ok={configured} />
        Supabase: {configured ? "מחובר" : "לא מוגדר ב-.env"}
      </span>

      {onVermillion ? (
        <span
          className="flex items-center gap-1.5 text-[var(--muted)]"
          title={realtime?.lastError ?? undefined}
        >
          <StatusDot ok={realtimeOk} warn={realtimeWarn} />
          יניקה: {label}
        </span>
      ) : (
        <span className="text-[var(--muted)]">יניקה: פעילה בעמוד מוצר</span>
      )}

      <span className="text-[var(--muted)]">עודכן: {lastLabel}</span>
      <span className="text-[var(--muted)]">({userCount} במאגר)</span>

      {onVermillion && realtime?.status === "error" && realtime.lastError && (
        <span className="w-full basis-full text-[10px] text-red-400">{realtime.lastError}</span>
      )}
    </>
  );
}
