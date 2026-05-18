import { db } from "@/lib/db";
import { hasLocalAppData } from "./status";
import type {
  VermillionCommitment,
  VermillionDashboard,
  VermillionProfile,
  VermillionUserDetail,
  VermillionUserRow,
} from "./types";

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

function emptyDashboard(): VermillionDashboard {
  const mk = monthKey();
  return {
    configured: false,
    monthKey: mk,
    totals: {
      users: 0,
      premium: 0,
      free: 0,
      intakeComplete: 0,
      onboardingComplete: 0,
      stampedUsersThisMonth: 0,
      totalStampsThisMonth: 0,
      avgStreak: 0,
      withTimerSet: 0,
    },
    prizePool: null,
    topStampers: [],
    recentUsers: [],
  };
}

function rowFromAppUser(record: {
  externalId: string;
  profileJson: string;
  commitmentJson: string;
  metricsJson: string;
}): VermillionUserRow | null {
  try {
    const profile = JSON.parse(record.profileJson) as VermillionProfile;
    const commitment =
      record.commitmentJson === "null"
        ? null
        : (JSON.parse(record.commitmentJson) as VermillionCommitment);
    const metrics = JSON.parse(record.metricsJson) as {
      stampsThisMonth: number;
      totalScoreThisMonth: number;
      avgMsDiffThisMonth: number | null;
      onboardingDays: number;
      chatMessageCount: number;
      timerDisplay: string | null;
    };
    return {
      ...profile,
      id: record.externalId,
      commitment,
      ...metrics,
    };
  } catch {
    return null;
  }
}

/** קריאה מהמסד המקומי בלבד — ללא מקור חיצוני */
export async function getVermillionDashboardFromStore(): Promise<VermillionDashboard> {
  if (!(await hasLocalAppData())) return emptyDashboard();

  const meta = await db.appSyncMeta.findUnique({ where: { id: "singleton" } });
  if (!meta?.dashboardCache) return emptyDashboard();

  try {
    const dash = JSON.parse(meta.dashboardCache) as VermillionDashboard;
    return { ...dash, configured: true };
  } catch {
    return emptyDashboard();
  }
}

export async function getVermillionUsersFromStore(): Promise<VermillionUserRow[]> {
  const records = await db.appUser.findMany({
    orderBy: { joinedAt: "desc" },
  });

  return records
    .map((r) => rowFromAppUser(r))
    .filter((r): r is VermillionUserRow => r !== null);
}

export async function getVermillionUserDetailFromStore(
  userId: string
): Promise<VermillionUserDetail | null> {
  const record = await db.appUser.findUnique({ where: { externalId: userId } });
  if (!record) return null;

  const row = rowFromAppUser(record);
  if (!row) return null;

  try {
    const detail = JSON.parse(record.detailJson) as {
      onboarding_answers: VermillionUserDetail["onboarding_answers"];
      financial_data: VermillionUserDetail["financial_data"];
      recent_stamps: VermillionUserDetail["recent_stamps"];
      game_sessions_count: number;
      monthStamps?: { score?: number; ms_diff?: number }[];
    };

    const monthStamps = detail.monthStamps ?? detail.recent_stamps ?? [];

    return {
      ...row,
      onboarding_answers: detail.onboarding_answers ?? [],
      financial_data: detail.financial_data ?? null,
      recent_stamps: detail.recent_stamps ?? [],
      game_sessions_count: detail.game_sessions_count ?? 0,
    };
  } catch {
    return {
      ...row,
      onboarding_answers: [],
      financial_data: null,
      recent_stamps: [],
      game_sessions_count: 0,
    };
  }
}
