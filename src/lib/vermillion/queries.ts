import { db } from "@/lib/db";
import {
  getVermillionDashboardFromStore,
  getVermillionUserDetailFromStore,
  getVermillionUsersFromStore,
  getChurnedUsersFromStore,
  getCeoDeletedUsersFromStore,
  type RemovedAppUserRow,
} from "./store";
import type { VermillionProfile } from "./types";
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

export type { RemovedAppUserRow };

export async function getChurnedUsers(): Promise<RemovedAppUserRow[]> {
  return getChurnedUsersFromStore();
}

export async function getCeoDeletedUsers(): Promise<RemovedAppUserRow[]> {
  return getCeoDeletedUsersFromStore();
}

/** JSON snapshot for AI analytics agent — מקומי בלבד */
export async function getVermillionAnalyticsSnapshot(): Promise<string> {
  const dash = await getVermillionDashboard();
  const users = await getVermillionUsers();

  const atRisk = users
    .filter(
      (u) =>
        u.onboarding_complete &&
        u.stampsThisMonth === 0 &&
        (u.commitment?.streak_days ?? 0) < 3
    )
    .slice(0, 15)
    .map((u) => ({
      id: u.id,
      name: u.name || u.email,
      onboardingDays: u.onboardingDays,
      streak: u.commitment?.streak_days,
    }));

  const premiumCandidates = users
    .filter((u) => u.subscription === "free" && u.stampsThisMonth >= 3)
    .sort((a, b) => b.totalScoreThisMonth - a.totalScoreThisMonth)
    .slice(0, 10)
    .map((u) => ({
      id: u.id,
      name: u.name || u.email,
      stampsThisMonth: u.stampsThisMonth,
      score: u.totalScoreThisMonth,
    }));

  const records = await db.appUser.findMany({
    where: { deletedAt: null },
    select: { profileJson: true, detailJson: true },
    take: 500,
  });

  let usersWithDailyLogs = 0;
  let unusedGameTokens = 0;
  const langCounts: Record<string, number> = {};

  for (const r of records) {
    try {
      const prof = JSON.parse(r.profileJson) as VermillionProfile;
      const lang = prof.lang ?? "unknown";
      langCounts[lang] = (langCounts[lang] ?? 0) + 1;
    } catch {
      /* skip */
    }
    try {
      const detail = JSON.parse(r.detailJson || "{}") as {
        daily_logs?: unknown[];
        game_sessions?: { token_used?: boolean }[];
      };
      if (Array.isArray(detail.daily_logs) && detail.daily_logs.length > 0) {
        usersWithDailyLogs++;
      }
      for (const g of detail.game_sessions ?? []) {
        if (g.token_used === false) unusedGameTokens++;
      }
    } catch {
      /* skip */
    }
  }

  return JSON.stringify(
    {
      month: dash.monthKey,
      configured: dash.configured,
      source: "crm_local_mirror",
      totals: dash.totals,
      prizePool: dash.prizePool,
      topStampers: dash.topStampers,
      intelligence: {
        atRiskUsers: atRisk,
        premiumUpgradeCandidates: premiumCandidates,
        usersWithProgramDays9to30: usersWithDailyLogs,
        gameSessionsWithUnusedToken: unusedGameTokens,
        languageBreakdown: langCounts,
        note: "atRisk = onboarding done, 0 stamps this month, low streak",
      },
      sampleUsers: dash.recentUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        subscription: u.subscription,
        lang: u.lang,
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
