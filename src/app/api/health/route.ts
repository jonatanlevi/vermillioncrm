import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai";

export async function GET() {
  const provider = getAIProvider();
  return NextResponse.json({
    status: "ok",
    app: "vermillioncrm",
    aiProvider: provider.name,
    version: "0.1.0",
  });
}
