"use client";

import { useVermillionSync } from "./vermillion-sync-poller";

export function RealtimeAlertBanner() {
  const { data } = useVermillionSync() ?? { data: null };
  const rt = data?.realtime;

  if (!rt?.enabled || rt.status === "live" || rt.status === "connecting") return null;

  const isError = rt.status === "error" || rt.status === "off";
  const errorSnippet = rt.lastError ? ` — ${rt.lastError.slice(0, 60)}` : "";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isError
          ? "bg-red-900/40 text-red-200 ring-1 ring-red-500/30"
          : "bg-yellow-900/40 text-yellow-200 ring-1 ring-yellow-500/30"
      }`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80" />
      Realtime מנותק{errorSnippet}
    </span>
  );
}
