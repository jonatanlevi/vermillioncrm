import { db } from "@/lib/db";
import { getIngestionClient, isIngestionSourceConfigured } from "@/lib/ingestion/app-source";
import { refreshAppUserFromSource, syncAppDataFromSource } from "./sync";

/** מחיקת משתמש אפליקציה ב-Supabase (auth + cascade) ובמאגר המקומי */
export async function deleteAppUserEverywhere(
  externalId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isIngestionSourceConfigured()) {
    return { ok: false, error: "מקור יניקה לא מוגדר" };
  }

  const sb = getIngestionClient();
  if (!sb) {
    return { ok: false, error: "לא ניתן להתחבר ל-Supabase" };
  }

  const { error } = await sb.auth.admin.deleteUser(externalId);
  if (error) {
    return { ok: false, error: error.message };
  }

  const removedAt = new Date();
  await db.appUser.updateMany({
    where: { externalId },
    data: { deletedAt: removedAt, ceoDeletedAt: removedAt },
  });

  const remaining = await db.appUser.count({ where: { deletedAt: null } });
  const meta = await db.appSyncMeta.findUnique({ where: { id: "singleton" } });
  if (meta) {
    await db.appSyncMeta.update({
      where: { id: "singleton" },
      data: { userCount: remaining },
    });
  }

  return { ok: true };
}

/** רענון כל המשתמשים מהמקור */
export async function refreshAllAppUsers() {
  return syncAppDataFromSource();
}

/** רענון משתמש בודד מהמקור */
export async function refreshOneAppUser(externalId: string) {
  return refreshAppUserFromSource(externalId);
}
