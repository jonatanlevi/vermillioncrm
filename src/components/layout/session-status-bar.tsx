import Link from "next/link";
import { getSyncStatusForUi } from "@/lib/vermillion/status";
import { IngestionStatusDisplay } from "./ingestion-status-display";
import { CrmAutoRefresh } from "./crm-auto-refresh";
import { QuickSyncButton } from "./quick-sync-button";
import { RealtimeAlertBanner } from "./realtime-alert-banner";

type Props = {
  role: string;
  userName?: string | null;
  userEmail?: string | null;
};

export async function SessionStatusBar({ role, userName, userEmail }: Props) {
  const isCeo = role === "CEO";
  const sync = await getSyncStatusForUi();

  const displayName = userName || userEmail || "משתמש";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs">
      <span
        className={`rounded-full px-2.5 py-1 font-semibold ${
          isCeo
            ? "bg-[var(--accent-dim)] text-white ring-1 ring-[var(--accent)]/40"
            : "bg-zinc-800 text-zinc-300"
        }`}
      >
        {isCeo ? "מחובר כמנכ״ל" : `מחובר · ${role === "EMPLOYEE" ? "עובד" : role}`}
      </span>
      <span className="text-[var(--muted)]">·</span>
      <span className="font-medium text-white">{displayName}</span>

      <span className="hidden h-4 w-px bg-[var(--border)] sm:inline-block" />

      <IngestionStatusDisplay
        initialConfigured={sync.ingestionConfigured}
        initialUserCount={sync.userCount}
        initialLastSyncAt={sync.lastSyncAt?.toISOString() ?? null}
      />

      <RealtimeAlertBanner />

      <div className="mr-auto flex flex-wrap items-center gap-2">
        <CrmAutoRefresh />
        <QuickSyncButton disabled={!sync.ingestionConfigured} />
        <Link
          href="/vermillion"
          className="rounded-md px-2 py-1 text-[var(--accent)] hover:underline"
        >
          הגדרות סנכרון
        </Link>
      </div>
    </div>
  );
}
