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
    where: { deletedAt: null },
    orderBy: { joinedAt: "desc" },
  });

  return records
    .map((r) => rowFromAppUser(r))
    .filter((r): r is VermillionUserRow => r !== null);
}

export type RemovedAppUserRow = VermillionUserRow & {
  deletedAt: Date;
  removedByCeo: boolean;
};

function mapRemovedUsers(
  records: {
    externalId: string;
    profileJson: string;
    commitmentJson: string;
    metricsJson: string;
    deletedAt: Date | null;
    ceoDeletedAt: Date | null;
  }[]
): RemovedAppUserRow[] {
  return records
    .map((r) => {
      const row = rowFromAppUser(r);
      if (!row || !r.deletedAt) return null;
      return {
        ...row,
        deletedAt: r.deletedAt,
        removedByCeo: r.ceoDeletedAt != null,
      };
    })
    .filter((r): r is RemovedAppUserRow => r !== null);
}

/** נטשו את האפליקציה (לא במקור, לא נמחקו ידנית) */
export async function getChurnedUsersFromStore(): Promise<RemovedAppUserRow[]> {
  const records = await db.appUser.findMany({
    where: { deletedAt: { not: null }, ceoDeletedAt: null },
    orderBy: { deletedAt: "desc" },
  });
  return mapRemovedUsers(records);
}

/** נמחקו ידנית על ידי מנכ״ל */
export async function getCeoDeletedUsersFromStore(): Promise<RemovedAppUserRow[]> {
  const records = await db.appUser.findMany({
    where: { ceoDeletedAt: { not: null } },
    orderBy: { ceoDeletedAt: "desc" },
  });
  return mapRemovedUsers(records);
}

/** כל מי שאינו פעיל (נטישה + מחיקת מנכ״ל) */
export async function getAllRemovedUsersFromStore(): Promise<RemovedAppUserRow[]> {
  const records = await db.appUser.findMany({
    where: { deletedAt: { not: null } },
    orderBy: { deletedAt: "desc" },
  });
  return mapRemovedUsers(records);
}

export async function getVermillionUserDetailFromStore(
  userId: string
): Promise<
  | (VermillionUserDetail & {
      deletedAt: Date | null;
      ceoDeletedAt: Date | null;
    })
  | null
> {
  const record = await db.appUser.findUnique({ where: { externalId: userId } });
  if (!record) return null;

  const row = rowFromAppUser(record);
  if (!row) return null;
  const syncedAt = record.syncedAt;
  const deletedAt = record.deletedAt;
  const ceoDeletedAt = record.ceoDeletedAt;

  try {
    const detail = JSON.parse(record.detailJson) as Partial<VermillionUserDetail>;

    return {
      ...row,
      syncedAt,
      deletedAt,
      ceoDeletedAt,
      onboarding_answers: detail.onboarding_answers ?? [],
      daily_answers: detail.daily_answers ?? {},
      financial_data: detail.financial_data ?? null,
      recent_stamps: detail.recent_stamps ?? [],
      daily_logs: detail.daily_logs ?? [],
      game_log_entries: detail.game_log_entries ?? {},
      game_sessions_count: detail.game_sessions_count ?? 0,
      chat_messages: detail.chat_messages ?? [],
      ai_memory: detail.ai_memory ?? null,
      onboarding_days_completed: detail.onboarding_days_completed ?? [],
      game_sessions: detail.game_sessions ?? [],
      auth_meta: detail.auth_meta ?? null,
    };
  } catch {
    return {
      ...row,
      syncedAt,
      deletedAt,
      ceoDeletedAt,
      onboarding_answers: [],
      daily_answers: {},
      financial_data: null,
      recent_stamps: [],
      daily_logs: [],
      game_log_entries: {},
      game_sessions_count: 0,
      chat_messages: [],
      ai_memory: null,
      onboarding_days_completed: [],
      game_sessions: [],
      auth_meta: null,
    };
  }
}
