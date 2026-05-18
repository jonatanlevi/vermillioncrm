export interface VermillionProfile {
  id: string;
  email: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  subscription: string;
  lang: string;
  onboarding_complete: boolean;
  profile_intake_complete: boolean;
  timezone: string | null;
  v_coins: number | null;
  joined_at: string;
  updated_at: string;
  terms_accepted_at: string | null;
}

export interface VermillionCommitment {
  user_id: string;
  committed_at: string | null;
  committed_hour: number | null;
  committed_minute: number | null;
  friday_target_hour: number | null;
  friday_target_minute: number | null;
  saturday_target_hour: number | null;
  saturday_target_minute: number | null;
  streak_days: number;
  updated_at: string;
}

export interface VermillionDailyStamp {
  id: string;
  user_id: string;
  day: number;
  month_key: string;
  stamped_at: string;
  committed_hour: number | null;
  committed_minute: number | null;
  ms_diff: number | null;
  score: number | null;
}

export interface VermillionUserRow extends VermillionProfile {
  commitment: VermillionCommitment | null;
  stampsThisMonth: number;
  totalScoreThisMonth: number;
  avgMsDiffThisMonth: number | null;
  onboardingDays: number;
  chatMessageCount: number;
  timerDisplay: string | null;
}

export interface VermillionDashboard {
  configured: boolean;
  monthKey: string;
  totals: {
    users: number;
    premium: number;
    free: number;
    intakeComplete: number;
    onboardingComplete: number;
    stampedUsersThisMonth: number;
    totalStampsThisMonth: number;
    avgStreak: number;
    withTimerSet: number;
  };
  prizePool: {
    activeSubscribers: number;
    monthlyRevenue: number;
    weeklyPrizeNet: number;
    operationalCosts: number;
  } | null;
  topStampers: { userId: string; name: string; stamps: number; score: number }[];
  recentUsers: VermillionUserRow[];
}

export interface VermillionUserDetail extends VermillionUserRow {
  onboarding_answers: { day: number; question_key: string; answer: string | null }[];
  financial_data: Record<string, unknown> | null;
  recent_stamps: VermillionDailyStamp[];
  game_sessions_count: number;
}
