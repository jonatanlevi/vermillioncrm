import { db } from "@/lib/db";
import type { VermillionDashboard } from "@/lib/vermillion/types";

export type AppProductSnapshot = {
  configured: boolean;
  userCount: number;
  lastSyncAt: Date | null;
  lastSyncStatus: string;
  users: number;
  premium: number;
  free: number;
  totalStampsThisMonth: number;
  stampedUsersThisMonth: number;
  avgStreak: number;
  withTimerSet: number;
  onboardingComplete: number;
};

function aggregateFromAppUsers(): Omit<
  AppProductSnapshot,
  "configured" | "userCount" | "lastSyncAt" | "lastSyncStatus"
> {
  return {
    users: 0,
    premium: 0,
    free: 0,
    totalStampsThisMonth: 0,
    stampedUsersThisMonth: 0,
    avgStreak: 0,
    withTimerSet: 0,
    onboardingComplete: 0,
  };
}

/** נתוני מוצר אמיתיים מ-AppSyncMeta / AppUser (לא demo) */
export async function getAppProductSnapshot(): Promise<AppProductSnapshot> {
  const meta = await db.appSyncMeta.findUnique({ where: { id: "singleton" } });
  const userCount = await db.appUser.count();

  if (meta?.dashboardCache) {
    try {
      const dash = JSON.parse(meta.dashboardCache) as VermillionDashboard;
      if (dash.totals) {
        return {
          configured: userCount > 0 || meta.lastSyncStatus === "OK",
          userCount: meta.userCount || userCount,
          lastSyncAt: meta.lastSyncAt,
          lastSyncStatus: meta.lastSyncStatus,
          users: dash.totals.users,
          premium: dash.totals.premium,
          free: dash.totals.free,
          totalStampsThisMonth: dash.totals.totalStampsThisMonth,
          stampedUsersThisMonth: dash.totals.stampedUsersThisMonth,
          avgStreak: dash.totals.avgStreak,
          withTimerSet: dash.totals.withTimerSet,
          onboardingComplete: dash.totals.onboardingComplete,
        };
      }
    } catch {
      /* fall through */
    }
  }

  if (userCount === 0) {
    return {
      configured: false,
      userCount: 0,
      lastSyncAt: meta?.lastSyncAt ?? null,
      lastSyncStatus: meta?.lastSyncStatus ?? "NEVER",
      ...aggregateFromAppUsers(),
    };
  }

  const records = await db.appUser.findMany();
  let premium = 0;
  let totalStamps = 0;
  let stampedUsers = 0;
  let withTimer = 0;
  let onboardingComplete = 0;
  const streaks: number[] = [];

  for (const r of records) {
    if (r.subscription === "premium") premium++;
    try {
      const metrics = JSON.parse(r.metricsJson) as {
        stampsThisMonth?: number;
        onboardingDays?: number;
        timerDisplay?: string | null;
      };
      const stamps = metrics.stampsThisMonth ?? 0;
      totalStamps += stamps;
      if (stamps > 0) stampedUsers++;
      if (metrics.timerDisplay) withTimer++;
      if ((metrics.onboardingDays ?? 0) >= 7) onboardingComplete++;
    } catch {
      /* skip */
    }
    try {
      const commitment =
        r.commitmentJson !== "null" ? JSON.parse(r.commitmentJson) : null;
      if (commitment?.streak_days != null) streaks.push(commitment.streak_days);
    } catch {
      /* skip */
    }
  }

  const users = records.length;
  const avgStreak =
    streaks.length > 0
      ? Math.round((streaks.reduce((a, b) => a + b, 0) / streaks.length) * 10) / 10
      : 0;

  return {
    configured: true,
    userCount: users,
    lastSyncAt: meta?.lastSyncAt ?? null,
    lastSyncStatus: meta?.lastSyncStatus ?? "OK",
    users,
    premium,
    free: users - premium,
    totalStampsThisMonth: totalStamps,
    stampedUsersThisMonth: stampedUsers,
    avgStreak,
    withTimerSet: withTimer,
    onboardingComplete,
  };
}
