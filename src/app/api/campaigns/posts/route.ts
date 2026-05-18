import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getNetwork } from "@/lib/social/networks";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const network = searchParams.get("network");

  if (!network || !getNetwork(network)) {
    return NextResponse.json({ error: "network required" }, { status: 400 });
  }

  const posts = await db.socialPost.findMany({
    where: { network },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      campaign: { select: { id: true, name: true, status: true } },
    },
  });

  const stats = await db.socialPost.groupBy({
    by: ["status"],
    where: { network },
    _count: true,
  });

  return NextResponse.json({ network, posts, stats });
}
