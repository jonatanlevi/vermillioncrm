import { getVermillionDashboard } from "@/lib/vermillion/queries";

/** כללי פרס חיים מהדשבורד המקומי (אחרי יניקת prize_config) */
export async function getLivePrizeContext(): Promise<string> {
  try {
    const dash = await getVermillionDashboard();
    const p = dash.prizePool;
    if (!p) {
      return "קופת פרס (חיה): לא זמינה — הרץ סנכרון מאפליקציה.";
    }
    return [
      "קופת פרס (נתונים חיים מהמראה המקומית, מ-prize_config + premium count):",
      `- מנויים premium פעילים (במראה): ${p.activeSubscribers}`,
      `- הכנסה חודשית משוערת: ₪${p.monthlyRevenue}`,
      `- הוצאות תפעול משוערות: ₪${p.operationalCosts}`,
      `- קופה שבועית נטו משוערת: ₪${p.weeklyPrizeNet}`,
      `חודש נוכחי במראה: ${dash.monthKey}`,
    ].join("\n");
  } catch {
    return "קופת פרס (חיה): שגיאה בקריאה מהמאגר המקומי.";
  }
}
