import { getVermillionDashboard } from "@/lib/vermillion/queries";
import { formatPrizeEconomicsForAI } from "./prize-economics";
import { fetchResolvedPrizeConfig } from "./prize-config";
import {
  computePrizeCalculation,
  formatPrizeCalculationsForUser,
} from "./prize-calculator";

/** כללי פרס חיים מהדשבורד המקומי (אחרי יניקת prize_config) */
export async function getLivePrizeContext(): Promise<string> {
  try {
    const dash = await getVermillionDashboard();
    const p = dash.prizePool;
    const config = await fetchResolvedPrizeConfig();

    if (!p || p.activeSubscribers <= 0) {
      return formatPrizeEconomicsForAI();
    }

    const result = computePrizeCalculation(p.activeSubscribers, config, {
      hypothetical: false,
    });

    const official = formatPrizeCalculationsForUser(
      [
        {
          title: `מצב נוכחי: ${p.activeSubscribers} מנויי premium (מראה CRM)`,
          result,
        },
      ],
      config
    );

    return `${formatPrizeEconomicsForAI()}\n\n${official}`;
  } catch {
    return formatPrizeEconomicsForAI();
  }
}
