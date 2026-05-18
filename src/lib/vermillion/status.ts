import { db } from "@/lib/db";
import { isIngestionSourceConfigured } from "@/lib/ingestion/app-source";

export type AppSyncStatus = "NEVER" | "RUNNING" | "OK" | "FAILED";

function syncMetaDelegate() {
  return (db as { appSyncMeta?: typeof db.customer }).appSyncMeta;
}

export async function getAppSyncMeta() {
  const meta = syncMetaDelegate();
  if (!meta) {
    throw new Error(
      "Prisma לא מעודכן. עצור npm run dev והרץ: npx prisma generate"
    );
  }
  return meta.upsert({
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
  const meta = syncMetaDelegate();
  if (!meta) return false;
  const row = await meta.findUnique({ where: { id: "singleton" } });
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
