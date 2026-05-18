import { NextResponse } from "next/server";
import { syncAppDataFromSource } from "@/lib/vermillion/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** יניקת נתונים מאפליקציית VerMillion → מסד CRM מקומי */
export async function POST() {
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
