import { NextResponse } from "next/server";
import { z } from "zod";
import { runAutonomousPipeline } from "@/lib/orchestrator";

const schema = z.object({ instruction: z.string().min(3) });

export async function POST(req: Request) {
  try {
    const { instruction } = schema.parse(await req.json());
    const result = await runAutonomousPipeline(instruction);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
