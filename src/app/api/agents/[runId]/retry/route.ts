import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { runAgent } from "@/lib/orchestrator";
import type { AgentId } from "@/lib/types/agents";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const session = await auth();
  if (session?.user?.role !== "CEO") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await params;
  const original = await db.agentRun.findUnique({ where: { id: runId } });

  if (!original || !["FAILED", "ERROR"].includes(original.status)) {
    return NextResponse.json({ error: "Run not found or not failed" }, { status: 400 });
  }

  try {
    const result = await runAgent({
      agentId: original.agentId as AgentId,
      input: original.input,
      chainJobs: true,
    });
    return NextResponse.json({ runId: result.runId });
  } catch {
    return NextResponse.json({ error: "שגיאה בהפעלת הסוכן" }, { status: 500 });
  }
}
