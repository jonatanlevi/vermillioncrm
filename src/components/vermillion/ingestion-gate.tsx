import { VermillionConfigBanner } from "./config-banner";
import { AppSyncPanel } from "./sync-panel";
import { getSyncStatusForUi, hasLocalAppData } from "@/lib/vermillion/status";

type Props = {
  children: React.ReactNode;
};

/** מציג הגדרת יניקה / כפתור סנכרון עד שיש נתונים מקומיים */
export async function IngestionGate({ children }: Props) {
  const status = await getSyncStatusForUi();
  const hasData = await hasLocalAppData();

  if (!status.ingestionConfigured) {
    return (
      <div className="space-y-4">
        <VermillionConfigBanner />
        <AppSyncPanel
          ingestionConfigured={false}
          lastSyncAt={status.lastSyncAt?.toISOString() ?? null}
          lastSyncStatus={status.lastSyncStatus}
          lastSyncError={status.lastSyncError}
          userCount={status.userCount}
        />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-4">
        <AppSyncPanel
          ingestionConfigured
          lastSyncAt={status.lastSyncAt?.toISOString() ?? null}
          lastSyncStatus={status.lastSyncStatus}
          lastSyncError={status.lastSyncError}
          userCount={status.userCount}
        />
        <p className="text-sm text-[var(--muted)]">
          עדיין אין נתונים במאגר המקומי. הפעל סנכרון כדי לראות מדדי מוצר.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AppSyncPanel
        ingestionConfigured
        lastSyncAt={status.lastSyncAt?.toISOString() ?? null}
        lastSyncStatus={status.lastSyncStatus}
        lastSyncError={status.lastSyncError}
        userCount={status.userCount}
      />
      {children}
    </div>
  );
}
