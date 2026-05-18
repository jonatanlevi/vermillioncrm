import { NextResponse } from "next/server";
import { processJobQueue } from "@/lib/jobs/processor";

export async function POST() {
  await processJobQueue();
  return NextResponse.json({ ok: true });
}
