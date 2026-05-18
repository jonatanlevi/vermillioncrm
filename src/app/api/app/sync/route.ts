import { NextResponse } from "next/server";
import { ensureRealtimeSyncStarted } from "@/lib/ingestion/realtime-sync";
import { syncAppDataFromSource } from "@/lib/vermillion/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** יניקת נתונים מאפליקציית VerMillion → מסד CRM מקומי */
export async function POST() {
  ensureRealtimeSyncStarted();
  const result = await syncAppDataFromSource();

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    userCount: result.userCount,
    syncedAt: result.syncedAt.toISOString(),
  });
}
