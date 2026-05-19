import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCeoSession, apiUnauthorized } from "@/lib/auth/session";
import { runAgent } from "@/lib/orchestrator";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  input: z.string().min(1).max(8000),
});

/** יועץ עלויות AI — מנכ״ל בלבד */
export async function POST(req: Request) {
  const session = await requireCeoSession();
  if (!session) return apiUnauthorized();

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  try {
    const result = await runAgent({
      agentId: "ai_ops",
      input: parsed.data.input,
      chainJobs: false,
      trigger: "manual",
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      runId: result.runId,
      agentId: "ai_ops",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
