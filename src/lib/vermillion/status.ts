import { db } from "@/lib/db";
import { isIngestionSourceConfigured } from "@/lib/ingestion/app-source";

export type AppSyncStatus = "NEVER" | "RUNNING" | "OK" | "FAILED";

export async function getAppSyncMeta() {
  return db.appSyncMeta.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
}

export function isIngestionConfigured(): boolean {
  return isIngestionSourceConfigured();
}

/** יש נתונים מקומיים לאחר סנכרון מוצלח */
export async function hasLocalAppData(): Promise<boolean> {
  const row = await db.appSyncMeta.findUnique({ where: { id: "singleton" } });
  return row?.lastSyncStatus === "OK" && row.userCount > 0;
}

export async function getSyncStatusForUi() {
  const meta = await getAppSyncMeta();
  const [activeCount, latestSynced] = await Promise.all([
    db.appUser.count({ where: { deletedAt: null } }),
    db.appUser.aggregate({ _max: { syncedAt: true } }),
  ]);
  const dataRevision = `${activeCount}:${latestSynced._max.syncedAt?.getTime() ?? 0}`;

  return {
    ingestionConfigured: isIngestionConfigured(),
    lastSyncAt: meta.lastSyncAt,
    lastSyncStatus: meta.lastSyncStatus as AppSyncStatus,
    lastSyncError: meta.lastSyncError,
    userCount: meta.userCount,
    activeUserCount: activeCount,
    monthKey: meta.monthKey,
    /** משתנה בכל עדכון משתמש בודד (Realtime / רענון) */
    dataRevision,
  };
}
