import { NextResponse } from "next/server";
import { requireSession, apiUnauthorized } from "@/lib/auth/session";
import { ensureRealtimeSyncStarted } from "@/lib/ingestion/realtime-sync";
import { reconcileActiveAppUsers } from "@/lib/vermillion/sync";

export const dynamic = "force-dynamic";

/** בדיקת התאמה קלה — מסמן נטשו בלי ייבוא מלא */
export async function POST() {
  const session = await requireSession();
  if (!session) return apiUnauthorized();

  ensureRealtimeSyncStarted();
  const result = await reconcileActiveAppUsers();
  return NextResponse.json(result);
}
