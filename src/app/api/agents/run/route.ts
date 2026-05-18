import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgent, runAutonomousPipeline } from "@/lib/orchestrator";
import type { AgentId } from "@/lib/types/agents";

const bodySchema = z.object({
  agentId: z.enum([
    "campaigns",
    "finance",
    "whatsapp",
    "sales",
    "media",
    "vermillion",
  ]),
  input: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  autonomous: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const { agentId, input, metadata, autonomous } = parsed.data;

    const result = autonomous
      ? await runAutonomousPipeline(input)
      : await runAgent({
          agentId: agentId as AgentId,
          input,
          metadata,
          chainJobs: true,
        });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Agent failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
