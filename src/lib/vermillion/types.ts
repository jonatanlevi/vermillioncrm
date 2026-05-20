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

export interface VermillionChatMessage {
  id?: string;
  role?: string;
  text?: string;
  content?: string;
  sentAt?: number;
  typingMs?: number | null;
  charsPerSec?: number | null;
  responseMs?: number | null;
}

export interface ActivityEvent {
  id: string;
  user_id: string;
  occurred_at: string;
  event_type: string;
  screen: string | null;
  payload: Record<string, unknown>;
  session_id: string | null;
  device_tz: string | null;
}

export interface VermillionGameSession {
  id: string;
  day?: number;
  month_key?: string;
  game_key?: string;
  /** @deprecated use game_key */
  game_type?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  game_score?: number;
  /** @deprecated use game_score */
  score?: number;
  token_used?: boolean;
}

export interface VermillionDailyLog {
  id: string;
  day: number;
  coaching_answer: string | null;
  challenge_done: boolean;
  multiplier: number;
  logged_at: string;
}

export interface VermillionAuthMeta {
  created_at: string | null;
  last_sign_in_at: string | null;
  provider: string | null;
}

export interface VermillionUserDetail extends VermillionUserRow {
  syncedAt?: Date;
  deletedAt?: Date | null;
  ceoDeletedAt?: Date | null;
  onboarding_answers: { day: number; question_key: string; answer: string | null }[];
  daily_answers?: Record<string, unknown>;
  financial_data: Record<string, unknown> | null;
  recent_stamps: VermillionDailyStamp[];
  daily_logs: VermillionDailyLog[];
  game_log_entries?: Record<string, unknown>;
  game_sessions_count: number;
  chat_messages: VermillionChatMessage[];
  ai_memory: { insights?: string[]; sessionCount?: number } | null;
  onboarding_days_completed: number[];
  game_sessions: VermillionGameSession[];
  auth_meta?: VermillionAuthMeta | null;
}
