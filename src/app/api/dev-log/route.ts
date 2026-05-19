import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const SECRET = process.env.DEV_LOG_SECRET ?? "vermillion-devlog-2026";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-dev-log-secret") !== SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    date?: string;
    generatedAt?: string;
    project?: string;
    version?: string;
    deployUrl?: string;
    commits?: unknown[];
    filesChanged?: unknown[];
    todosRemaining?: unknown[];
    recentDone?: unknown[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const {
    date,
    generatedAt,
    project = "VerMillion",
    version,
    deployUrl,
    commits = [],
    filesChanged = [],
    todosRemaining = [],
    recentDone = [],
  } = body;

  if (!date || !generatedAt) {
    return NextResponse.json({ error: "missing date or generatedAt" }, { status: 400 });
  }

  await db.devLog.upsert({
    where: { date_project: { date, project } },
    create: {
      date,
      generatedAt: new Date(generatedAt),
      project,
      version: version ?? null,
      deployUrl: deployUrl ?? null,
      commits:      JSON.stringify(commits),
      filesChanged: JSON.stringify(filesChanged),
      todos:        JSON.stringify(todosRemaining),
      recentDone:   JSON.stringify(recentDone),
    },
    update: {
      generatedAt: new Date(generatedAt),
      version:     version ?? null,
      deployUrl:   deployUrl ?? null,
      commits:      JSON.stringify(commits),
      filesChanged: JSON.stringify(filesChanged),
      todos:        JSON.stringify(todosRemaining),
      recentDone:   JSON.stringify(recentDone),
    },
  });

  return NextResponse.json({ ok: true });
}
