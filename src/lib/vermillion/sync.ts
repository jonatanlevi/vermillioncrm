import { db } from "@/lib/db";
import { getIngestionClient, isIngestionSourceConfigured } from "@/lib/ingestion/app-source";
import type {
  VermillionCommitment,
  VermillionDailyStamp,
  VermillionDashboard,
  VermillionProfile,
  VermillionUserRow,
} from "./types";
import { formatTimer } from "./format";

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

function countChatMessages(messages: unknown): number {
  if (!Array.isArray(messages)) return 0;
  return messages.length;
}

async function fetchPrizePoolSummary() {
  const url =
    process.env.VERMILLION_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_VERMILLION_APP_URL?.replace(/\/$/, "");

  if (!url) return null;

  try {
    const res = await fetch(`${url}/api/prize-pool`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      activeSubscribers: data.activeSubscribers ?? 0,
      monthlyRevenue: data.monthlyRevenue ?? 0,
      weeklyPrizeNet: data.weeklyPrizeNet ?? 0,
      operationalCosts: data.operationalCosts ?? 0,
    };
  } catch {
    return null;
  }
}

async function computePrizePoolFromSource(sb: NonNullable<ReturnType<typeof getIngestionClient>>) {
  const month = monthKey();
  const [cfgRes, premiumRes, costsRes] = await Promise.all([
    sb.from("prize_config").select("*").eq("id", 1).maybeSingle(),
    sb.from("profiles").select("id", { count: "exact", head: true }).eq("subscription", "premium"),
    sb.from("operational_costs").select("amount_ils").eq("month", month),
  ]);

  const cfg = cfgRes.data;
  const activeSubscribers = premiumRes.count ?? 0;
  const costs = costsRes.data ?? [];
  const actualCosts = costs.reduce((s, r) => s + Number(r.amount_ils || 0), 0);
  const monthlyPrice = Number(cfg?.monthly_price_ils ?? 99);
  const monthlyRevenue = activeSubscribers * monthlyPrice;
  const opPct = Number(cfg?.operational_cost_pct ?? 20);
  const operationalCosts =
    actualCosts > 0 ? actualCosts : monthlyRevenue * (opPct / 100);
  const net = Math.max(0, monthlyRevenue - operationalCosts);
  const poolPct = Number(cfg?.prize_pool_pct ?? 50);
  const monthlyPool = net * (poolPct / 100);
  const weeklyNet =
    (monthlyPool / 4) * (1 - Number(cfg?.withholding_tax_pct ?? 0) / 100);

  return {
    activeSubscribers,
    monthlyRevenue: Math.round(monthlyRevenue),
    weeklyPrizeNet: Math.round(weeklyNet),
    operationalCosts: Math.round(operationalCosts),
  };
}

function buildRows(
  profiles: VermillionProfile[],
  commitments: Map<string, VermillionCommitment>,
  stampByUser: Map<string, { count: number; score: number; msSum: number; msN: number }>,
  onboardingMap: Map<string, number>,
  chatMap: Map<string, number>
): VermillionUserRow[] {
  return profiles.map((p) => {
    const c = commitments.get(p.id) ?? null;
    const st = stampByUser.get(p.id);
    return {
      ...p,
      commitment: c,
      stampsThisMonth: st?.count ?? 0,
      totalScoreThisMonth: st?.score ?? 0,
      avgMsDiffThisMonth: st?.msN ? Math.round(st.msSum / st.msN) : null,
      onboardingDays: onboardingMap.get(p.id) ?? 0,
      chatMessageCount: chatMap.get(p.id) ?? 0,
      timerDisplay: formatTimer(c?.committed_hour, c?.committed_minute),
    };
  });
}

function buildDashboard(
  rows: VermillionUserRow[],
  profiles: VermillionProfile[],
  commitments: Map<string, VermillionCommitment>,
  stampByUser: Map<string, { count: number; score: number }>,
  prizePool: VermillionDashboard["prizePool"],
  mk: string
): VermillionDashboard {
  const premium = profiles.filter((p) => p.subscription === "premium").length;
  const totalStamps = [...stampByUser.values()].reduce((s, v) => s + v.count, 0);
  const streaks = [...commitments.values()].map((c) => c.streak_days ?? 0);
  const withTimer = [...commitments.values()].filter(
    (c) => c.committed_hour != null && c.committed_minute != null
  ).length;

  const topStampers = [...stampByUser.entries()]
    .map(([userId, v]) => {
      const prof = profiles.find((p) => p.id === userId);
      return {
        userId,
        name: prof?.name || prof?.email || userId.slice(0, 8),
        stamps: v.count,
        score: v.score,
      };
    })
    .sort((a, b) => b.score - a.score || b.stamps - a.stamps)
    .slice(0, 10);

  return {
    configured: true,
    monthKey: mk,
    totals: {
      users: profiles.length,
      premium,
      free: profiles.length - premium,
      intakeComplete: profiles.filter((p) => p.profile_intake_complete).length,
      onboardingComplete: profiles.filter((p) => p.onboarding_complete).length,
      stampedUsersThisMonth: stampByUser.size,
      totalStampsThisMonth: totalStamps,
      avgStreak:
        streaks.length > 0
          ? Math.round((streaks.reduce((a, b) => a + b, 0) / streaks.length) * 10) / 10
          : 0,
      withTimerSet: withTimer,
    },
    prizePool,
    topStampers,
    recentUsers: rows.slice(0, 15),
  };
}

function parseChatMessages(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.map((m) => {
    const item = m as Record<string, unknown>;
    return {
      role: String(item.role ?? ""),
      text: String(item.text ?? item.content ?? ""),
    };
  });
}

async function fetchUserDetailFromSource(
  sb: NonNullable<ReturnType<typeof getIngestionClient>>,
  userId: string,
  mk: string
) {
  const [
    profileRes,
    commitmentRes,
    stampsRes,
    onboardingRes,
    chatRes,
    answersRes,
    financialRes,
    gamesRes,
    gamesListRes,
  ] = await Promise.all([
    sb.from("profiles").select("ai_memory").eq("id", userId).maybeSingle(),
    sb.from("commitment").select("*").eq("user_id", userId).maybeSingle(),
    sb
      .from("daily_stamps")
      .select("*")
      .eq("user_id", userId)
      .order("stamped_at", { ascending: false })
      .limit(60),
    sb.from("onboarding_state").select("days_completed").eq("user_id", userId).maybeSingle(),
    sb.from("chat_history").select("messages").eq("user_id", userId).maybeSingle(),
    sb
      .from("onboarding_answers")
      .select("day, question_key, answer")
      .eq("user_id", userId)
      .order("day"),
    sb.from("financial_data").select("data").eq("user_id", userId).maybeSingle(),
    sb
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    sb
      .from("game_sessions")
      .select("id, game_type, completed_at, duration_ms, score")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(25),
  ]);

  const c = commitmentRes.data as VermillionCommitment | null;
  const chatRaw = (chatRes.data as { messages?: unknown } | null)?.messages;
  const daysCompleted =
    (onboardingRes.data as { days_completed?: number[] } | null)?.days_completed ?? [];

  return {
    onboarding_answers: answersRes.data ?? [],
    financial_data:
      (financialRes.data as { data?: Record<string, unknown> } | null)?.data ?? null,
    recent_stamps: (stampsRes.data ?? []) as VermillionDailyStamp[],
    game_sessions_count: gamesRes.count ?? 0,
    game_sessions: (gamesListRes.data ?? []) as {
      id: string;
      game_type?: string;
      completed_at?: string;
      duration_ms?: number;
      score?: number;
    }[],
    commitment: c,
    onboardingDays: daysCompleted.length,
    onboarding_days_completed: daysCompleted,
    chatMessageCount: countChatMessages(chatRaw),
    chat_messages: parseChatMessages(chatRaw),
    ai_memory:
      (profileRes.data as { ai_memory?: { insights?: string[]; sessionCount?: number } } | null)
        ?.ai_memory ?? null,
    monthStamps: (stampsRes.data ?? []).filter(
      (s: VermillionDailyStamp) => s.month_key === mk
    ),
  };
}

/** רענון משתמש בודד מהמקור → עדכון AppUser מקומי */
export async function refreshAppUserFromSource(
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isIngestionSourceConfigured()) {
    return { ok: false, error: "מקור יניקה לא מוגדר" };
  }
  const sb = getIngestionClient();
  if (!sb) return { ok: false, error: "לא ניתן להתחבר למקור" };

  const mk = monthKey();
  const profileRes = await sb
    .from("profiles")
    .select(
      "id, email, name, first_name, last_name, phone, date_of_birth, subscription, lang, onboarding_complete, profile_intake_complete, timezone, v_coins, joined_at, updated_at, terms_accepted_at"
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileRes.error || !profileRes.data) {
    return { ok: false, error: profileRes.error?.message ?? "משתמש לא נמצא במקור" };
  }

  const profile = profileRes.data as VermillionProfile;
  const detail = await fetchUserDetailFromSource(sb, userId, mk);
  const commitment = detail.commitment;

  const stampByUser = new Map<string, { count: number; score: number; msSum: number; msN: number }>();
  for (const s of detail.monthStamps ?? []) {
    const cur = stampByUser.get(userId) ?? { count: 0, score: 0, msSum: 0, msN: 0 };
    cur.count += 1;
    cur.score += Number(s.score ?? 0);
    if (s.ms_diff != null) {
      cur.msSum += Number(s.ms_diff);
      cur.msN += 1;
    }
    stampByUser.set(userId, cur);
  }
  const st = stampByUser.get(userId);
  const row = buildRows(
    [profile],
    commitment ? new Map([[userId, commitment]]) : new Map(),
    stampByUser,
    new Map([[userId, detail.onboardingDays]]),
    new Map([[userId, detail.chatMessageCount]])
  )[0];

  const syncedAt = new Date();
  await db.appUser.upsert({
    where: { externalId: userId },
    create: {
      externalId: userId,
      email: row.email,
      name: row.name || row.first_name || null,
      phone: row.phone,
      subscription: row.subscription,
      profileJson: JSON.stringify(row),
      commitmentJson: JSON.stringify(row.commitment),
      metricsJson: JSON.stringify({
        stampsThisMonth: row.stampsThisMonth,
        totalScoreThisMonth: row.totalScoreThisMonth,
        avgMsDiffThisMonth: row.avgMsDiffThisMonth,
        onboardingDays: row.onboardingDays,
        chatMessageCount: row.chatMessageCount,
        timerDisplay: row.timerDisplay,
      }),
      detailJson: JSON.stringify(detail),
      syncedAt,
      joinedAt: row.joined_at ? new Date(row.joined_at) : null,
    },
    update: {
      email: row.email,
      name: row.name || row.first_name || null,
      phone: row.phone,
      subscription: row.subscription,
      profileJson: JSON.stringify(row),
      commitmentJson: JSON.stringify(row.commitment),
      metricsJson: JSON.stringify({
        stampsThisMonth: row.stampsThisMonth,
        totalScoreThisMonth: row.totalScoreThisMonth,
        avgMsDiffThisMonth: row.avgMsDiffThisMonth,
        onboardingDays: row.onboardingDays,
        chatMessageCount: row.chatMessageCount,
        timerDisplay: row.timerDisplay,
      }),
      detailJson: JSON.stringify(detail),
      syncedAt,
      joinedAt: row.joined_at ? new Date(row.joined_at) : null,
    },
  });

  return { ok: true };
}

export type SyncResult =
  | { ok: true; userCount: number; syncedAt: Date }
  | { ok: false; error: string };

/**
 * יניקה חד-כיוונית: מקור האפליקציה → מסד CRM מקומי (Prisma).
 * אין קריאות למקור מחוץ לפונקציה זו.
 */
export async function syncAppDataFromSource(): Promise<SyncResult> {
  if (!isIngestionSourceConfigured()) {
    return {
      ok: false,
      error: "מקור יניקה לא מוגדר (VERMILLION_INGESTION_URL + KEY ב-.env)",
    };
  }

  const sb = getIngestionClient();
  if (!sb) {
    return { ok: false, error: "לא ניתן להתחבר למקור היניקה" };
  }

  const mk = monthKey();

  await db.appSyncMeta.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", lastSyncStatus: "RUNNING", monthKey: mk },
    update: { lastSyncStatus: "RUNNING", lastSyncError: null, monthKey: mk },
  });

  try {
    const [
      profilesRes,
      commitmentsRes,
      stampsRes,
      onboardingRes,
      chatsRes,
      prizePool,
    ] = await Promise.all([
      sb
        .from("profiles")
        .select(
          "id, email, name, first_name, last_name, phone, date_of_birth, subscription, lang, onboarding_complete, profile_intake_complete, timezone, v_coins, joined_at, updated_at, terms_accepted_at"
        )
        .order("joined_at", { ascending: false }),
      sb.from("commitment").select("*"),
      sb.from("daily_stamps").select("user_id, score, ms_diff").eq("month_key", mk),
      sb.from("onboarding_state").select("user_id, days_completed"),
      sb.from("chat_history").select("user_id, messages"),
      fetchPrizePoolSummary().then((p) => p ?? computePrizePoolFromSource(sb)),
    ]);

    if (profilesRes.error) throw new Error(profilesRes.error.message);

    const profiles = (profilesRes.data ?? []) as VermillionProfile[];
    const commitments = new Map(
      ((commitmentsRes.data ?? []) as VermillionCommitment[]).map((c) => [c.user_id, c])
    );

    const stampByUser = new Map<
      string,
      { count: number; score: number; msSum: number; msN: number }
    >();
    for (const s of stampsRes.data ?? []) {
      const cur = stampByUser.get(s.user_id) ?? {
        count: 0,
        score: 0,
        msSum: 0,
        msN: 0,
      };
      cur.count += 1;
      cur.score += Number(s.score ?? 0);
      if (s.ms_diff != null) {
        cur.msSum += Number(s.ms_diff);
        cur.msN += 1;
      }
      stampByUser.set(s.user_id, cur);
    }

    const onboardingMap = new Map(
      (onboardingRes.data ?? []).map(
        (o: { user_id: string; days_completed: number[] | null }) => [
          o.user_id,
          o.days_completed?.length ?? 0,
        ]
      )
    );

    const chatMap = new Map(
      (chatsRes.data ?? []).map(
        (c: { user_id: string; messages: unknown }) => [
          c.user_id,
          countChatMessages(c.messages),
        ]
      )
    );

    const rows = buildRows(
      profiles,
      commitments,
      stampByUser,
      onboardingMap,
      chatMap
    );

    const dashboard = buildDashboard(
      rows,
      profiles,
      commitments,
      stampByUser,
      prizePool,
      mk
    );

    const syncedAt = new Date();

    const details = await Promise.all(
      rows.map((row) => fetchUserDetailFromSource(sb, row.id, mk))
    );

    await db.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const detail = details[i];
        await tx.appUser.upsert({
          where: { externalId: row.id },
          create: {
            externalId: row.id,
            email: row.email,
            name: row.name || row.first_name || null,
            phone: row.phone,
            subscription: row.subscription,
            profileJson: JSON.stringify(row),
            commitmentJson: JSON.stringify(row.commitment),
            metricsJson: JSON.stringify({
              stampsThisMonth: row.stampsThisMonth,
              totalScoreThisMonth: row.totalScoreThisMonth,
              avgMsDiffThisMonth: row.avgMsDiffThisMonth,
              onboardingDays: row.onboardingDays,
              chatMessageCount: row.chatMessageCount,
              timerDisplay: row.timerDisplay,
            }),
            detailJson: JSON.stringify(detail),
            syncedAt,
            joinedAt: row.joined_at ? new Date(row.joined_at) : null,
          },
          update: {
            email: row.email,
            name: row.name || row.first_name || null,
            phone: row.phone,
            subscription: row.subscription,
            profileJson: JSON.stringify(row),
            commitmentJson: JSON.stringify(row.commitment),
            metricsJson: JSON.stringify({
              stampsThisMonth: row.stampsThisMonth,
              totalScoreThisMonth: row.totalScoreThisMonth,
              avgMsDiffThisMonth: row.avgMsDiffThisMonth,
              onboardingDays: row.onboardingDays,
              chatMessageCount: row.chatMessageCount,
              timerDisplay: row.timerDisplay,
            }),
            detailJson: JSON.stringify(detail),
            syncedAt,
            joinedAt: row.joined_at ? new Date(row.joined_at) : null,
          },
        });
      }

      // סמן כנטשו משתמשים שלא חזרו מהמקור
      const activeIds = new Set(profiles.map((p) => p.id));
      await tx.appUser.updateMany({
        where: { deletedAt: null, externalId: { notIn: [...activeIds] } },
        data: { deletedAt: syncedAt },
      });

      // אפס deletedAt למי שחזר (הוחזר לאחר מחיקה)
      await tx.appUser.updateMany({
        where: { deletedAt: { not: null }, externalId: { in: [...activeIds] } },
        data: { deletedAt: null },
      });

      await tx.appSyncMeta.upsert({
        where: { id: "singleton" },
        create: {
          id: "singleton",
          lastSyncAt: syncedAt,
          lastSyncStatus: "OK",
          monthKey: mk,
          dashboardCache: JSON.stringify(dashboard),
          userCount: profiles.length,
        },
        update: {
          lastSyncAt: syncedAt,
          lastSyncStatus: "OK",
          lastSyncError: null,
          monthKey: mk,
          dashboardCache: JSON.stringify(dashboard),
          userCount: profiles.length,
        },
      });
    });

    return { ok: true, userCount: profiles.length, syncedAt };
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאת סנכרון";
    await db.appSyncMeta.update({
      where: { id: "singleton" },
      data: { lastSyncStatus: "FAILED", lastSyncError: message },
    });
    return { ok: false, error: message };
  }
}
