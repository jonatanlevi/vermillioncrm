import {
  getVermillionDashboardFromStore,
  getVermillionUserDetailFromStore,
  getVermillionUsersFromStore,
} from "./store";
import type {
  VermillionDashboard,
  VermillionUserDetail,
  VermillionUserRow,
} from "./types";

export { formatTimer } from "./format";

/** נתוני אפליקציה מהמסד המקומי (לאחר יניקה) */
export async function getVermillionDashboard(): Promise<VermillionDashboard> {
  return getVermillionDashboardFromStore();
}

export async function getVermillionUsers(): Promise<VermillionUserRow[]> {
  return getVermillionUsersFromStore();
}

export async function getVermillionUserDetail(
  userId: string
): Promise<VermillionUserDetail | null> {
  return getVermillionUserDetailFromStore(userId);
}

/** JSON snapshot for AI analytics agent — מקומי בלבד */
export async function getVermillionAnalyticsSnapshot(): Promise<string> {
  const dash = await getVermillionDashboard();
  return JSON.stringify(
    {
      month: dash.monthKey,
      configured: dash.configured,
      source: "crm_local_mirror",
      totals: dash.totals,
      prizePool: dash.prizePool,
      topStampers: dash.topStampers,
      sampleUsers: dash.recentUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        subscription: u.subscription,
        timer: u.timerDisplay,
        streak: u.commitment?.streak_days,
        stampsThisMonth: u.stampsThisMonth,
        score: u.totalScoreThisMonth,
        onboardingDays: u.onboardingDays,
        chatMessages: u.chatMessageCount,
        intake: u.profile_intake_complete,
        onboarding: u.onboarding_complete,
      })),
    },
    null,
    2
  );
}
