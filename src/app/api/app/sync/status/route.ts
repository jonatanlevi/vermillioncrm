import { NextResponse } from "next/server";
import { getRealtimeSyncStatus } from "@/lib/ingestion/realtime-sync";
import { getSyncStatusForUi } from "@/lib/vermillion/status";

export const dynamic = "force-dynamic";

export async function GET() {
  const sync = await getSyncStatusForUi();
  const realtime = getRealtimeSyncStatus();

  return NextResponse.json({
    ...sync,
    realtime,
  });
}
