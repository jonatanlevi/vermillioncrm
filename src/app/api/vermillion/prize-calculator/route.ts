import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  computePrizeCalculation,
  formatPrizeCalculationsForUser,
} from "@/lib/product-knowledge/prize-calculator";
import { fetchResolvedPrizeConfig } from "@/lib/product-knowledge/prize-config";

export const dynamic = "force-dynamic";

/** חישוב פרסים מדויק — GET ?subscribers=100&hypothetical=true */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("subscribers");
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n < 0 || n > 5_000_000) {
    return NextResponse.json(
      { error: "פרמטר subscribers חייב להיות מספר 0–5000000" },
      { status: 400 }
    );
  }

  const hypothetical = searchParams.get("hypothetical") !== "false";
  const config = await fetchResolvedPrizeConfig();
  const result = computePrizeCalculation(n, config, { hypothetical });
  const markdown = formatPrizeCalculationsForUser(
    [
      {
        title: `תרחיש: ${n.toLocaleString("he-IL")} מנויי premium`,
        result,
      },
    ],
    config
  );

  return NextResponse.json({
    ok: true,
    subscribers: n,
    config,
    result,
    markdown,
  });
}
