import { NextResponse } from "next/server";
import { getRealtimeSyncStatus } from "@/lib/ingestion/realtime-sync";
import { getSyncStatusForUi } from "@/lib/vermillion/status";

export const dynamic = "force-dynamic";

export async function GET() {
  const sync = await getSyncStatusForUi();
  const realtime = getRealtimeSyncStatus();

  return NextResponse.json({
    ingestionConfigured: sync.ingestionConfigured,
    lastSyncAt: sync.lastSyncAt?.toISOString() ?? null,
    lastSyncStatus: sync.lastSyncStatus,
    lastSyncError: sync.lastSyncError,
    userCount: sync.userCount,
    activeUserCount: sync.activeUserCount,
    dataRevision: sync.dataRevision,
    realtime: {
      ...realtime,
      lastEventAt: realtime.lastEventAt?.toISOString() ?? null,
    },
  });
}
