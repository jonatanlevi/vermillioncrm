export type QuestionMeta = {
  label: string;
  day: number;
  type: "choice" | "number" | "open";
  prefix?: string;
  suffix?: string;
  options?: Record<string, string>;
};

export const DAY_META: Record<number, { topic: string; icon: string }> = {
  1: { topic: "מי אתה", icon: "🧬" },
  2: { topic: "עבודה ושגרה", icon: "💼" },
  3: { topic: "ערכים ופחדים", icon: "🧭" },
  4: { topic: "הכנסות", icon: "💰" },
  5: { topic: "הוצאות", icon: "📊" },
  6: { topic: "חובות ונכסים", icon: "⚖️" },
  7: { topic: "מטרות ותוכנית", icon: "🎯" },
};

export const QUESTION_MAP: Record<string, QuestionMeta> = {
  // יום 1 — מי אתה
  family_status: {
    label: "מצב משפחתי", day: 1, type: "choice",
    options: { single: "רווק/ה", partner: "בזוגיות", married: "נשוי/אה", divorced: "גרוש/ה", widowed: "אלמן/אלמנה" },
  },
  life_event_recency: {
    label: "מועד האירוע המשפחתי", day: 1, type: "choice",
    options: { recent: "פחות משנה", mid: "1–5 שנים", long_ago: "מעל 5 שנים" },
  },
  children_count: {
    label: "ילדים תלויים כלכלית", day: 1, type: "choice",
    options: { "0": "אין ילדים", "1": "ילד אחד", "2": "שני ילדים", "3+": "שלושה+" },
  },
  housing_type: {
    label: "סטטוס דיור", day: 1, type: "choice",
    options: { renting: "שוכר", owner: "בעלים", parents: "אצל ההורים", other: "אחר" },
  },
  city_type: {
    label: "אזור מגורים", day: 1, type: "choice",
    options: { center: "מרכז", jerusalem: "ירושלים", north: "צפון", south: "דרום", abroad: 'חו"ל' },
  },

  // יום 2 — עבודה ושגרה
  employment_type: {
    label: "סוג תעסוקה", day: 2, type: "choice",
    options: { employee: "שכיר", self_employed: "עצמאי", business: "בעל עסק", freelance: "פרילנסר", unemployed: "לא עובד כרגע" },
  },
  work_hours_weekly: { label: "שעות עבודה שבועיות", day: 2, type: "number", suffix: "שעות" },
  top_hobby: {
    label: "תחביב עיקרי (הוצאה)", day: 2, type: "choice",
    options: { sports: "ספורט / כושר", food: "אוכל / מסעדות", travel: "טיולים / נסיעות", tech: "טכנולוגיה", social: "חברים / בר", family: "משפחה / ילדים" },
  },
  social_budget: {
    label: "תקציב חברתי חודשי", day: 2, type: "choice",
    options: { low: "עד ₪500", medium: "₪500–₪1,500", high: "₪1,500–₪3,000", very_high: "₪3,000+" },
  },

  // יום 3 — ערכים ופחדים
  money_goal: {
    label: "מניע עיקרי לשינוי", day: 3, type: "choice",
    options: { freedom: "חופש כלכלי", security: "ביטחון", wealth: "לבנות עושר", debt_free: "יציאה מחובות", business: "להקים עסק", retire: "פרישה מוקדמת (FIRE)" },
  },
  money_fear: {
    label: "פחד פיננסי עיקרי", day: 3, type: "choice",
    options: { not_enough: "לא יהיה מספיק", lose_it: "לאבד מה שיש", old_age: "זקנה בלי כסף", surprise: "הפתעה רעה", no_fear: "לא ממש פוחד" },
  },
  extra_money_action: {
    label: "מה תעשה עם ₪10,000 פנויים", day: 3, type: "choice",
    options: { save: "שם בפיקדון", invest: "משקיע בבורסה", pay_debt: "משלם חובות", buy: "קונה משהו שרציתי", business: "משקיע בעסק שלי", realestate: 'נדל"ן להשקעה' },
  },

  // יום 4 — הכנסות
  net_income: { label: "הכנסה חודשית נטו", day: 4, type: "number", prefix: "₪" },
  side_income: { label: "הכנסות נוספות", day: 4, type: "number", prefix: "₪" },
  num_earners: {
    label: "מספר מפרנסים בבית", day: 4, type: "choice",
    options: { "1": "רק אני", "2": "שניים", "3+": "שלושה+" },
  },
  partner_income: { label: "הכנסת בן/בת זוג", day: 4, type: "number", prefix: "₪" },

  // יום 5 — הוצאות
  housing_expense: { label: "שכירות / משכנתא חודשי", day: 5, type: "number", prefix: "₪" },
  fixed_expenses: { label: "הוצאות קבועות חודשיות", day: 5, type: "number", prefix: "₪" },
  variable_expenses: { label: "הוצאות משתנות חודשיות", day: 5, type: "number", prefix: "₪" },

  // יום 6 — חובות ונכסים
  mortgage_balance: { label: "יתרת משכנתא", day: 6, type: "number", prefix: "₪" },
  loans_total: { label: "סך הלוואות", day: 6, type: "number", prefix: "₪" },
  credit_debt: { label: "חוב אשראי / מינוס", day: 6, type: "number", prefix: "₪" },
  liquid_savings: { label: 'חיסכון נזיל (עו"ש, פיקדונות)', day: 6, type: "number", prefix: "₪" },
  investments: { label: "תיק השקעות + קרן השתלמות", day: 6, type: "number", prefix: "₪" },
  real_estate_equity: { label: 'הון עצמי בנדל"ן', day: 6, type: "number", prefix: "₪" },

  // יום 7 — מטרות ותוכנית
  retirement_age: { label: "גיל יעד לעצמאות כלכלית", day: 7, type: "number", suffix: "שנים" },
  financial_target: { label: "יעד ביטחון פיננסי", day: 7, type: "number", prefix: "₪" },
  monthly_savings_target: { label: "חיסכון בפועל כל חודש", day: 7, type: "number", prefix: "₪" },
  pension_monthly: { label: "הפקדה פנסיונית חודשית", day: 7, type: "number", prefix: "₪" },
  saving_obstacle: {
    label: "מכשול עיקרי לחיסכון", day: 7, type: "choice",
    options: { income_low: "ההכנסה לא מספיקה", expenses_high: "ההוצאות גבוהות מדי", no_habit: "אין הרגל", dont_know: "לא יודע מאיפה להתחיל" },
  },
  biggest_leak: { label: '"החור" הכי גדול בכיס', day: 7, type: "open" },
  commitment: {
    label: "מחויבות יומית", day: 7, type: "choice",
    options: { "5": "5 דקות ביום", "15": "15 דקות ביום", "30+": "חצי שעה+" },
  },
};

export function formatAnswer(key: string, raw: unknown): string {
  if (raw == null || raw === "" || raw === "__skipped__") return "—";
  const meta = QUESTION_MAP[key];
  if (!meta) return String(raw);
  if (meta.type === "choice" && meta.options) {
    return meta.options[String(raw)] ?? String(raw);
  }
  if (meta.type === "number") {
    const num = Number(raw);
    if (isNaN(num)) return String(raw);
    const formatted = num.toLocaleString("he-IL");
    return [meta.prefix, formatted, meta.suffix].filter(Boolean).join(" ");
  }
  return String(raw);
}

/** מטא-שדות בתוך onboarding_state.daily_answers — לא תשובות לשאלון */
const DAILY_ANSWERS_META = new Set([
  "startDate",
  "daysCompleted",
  "profileGenerated",
  "profileText",
  "profile",
]);

/** מיפוי שמות מהאפליקציה (camelCase / financial_data) → מפתחות QUESTION_MAP */
export const FINANCIAL_KEY_ALIASES: Record<string, string> = {
  familyStatus: "family_status",
  employmentType: "employment_type",
  netIncome: "net_income",
  sideIncome: "side_income",
  spouseIncome: "partner_income",
  partnerIncome: "partner_income",
  housingCost: "housing_expense",
  housingType: "housing_type",
  fixedExpenses: "fixed_expenses",
  variableExpenses: "variable_expenses",
  creditDebt: "credit_debt",
  loans: "loans_total",
  overdraft: "credit_debt",
  savings: "liquid_savings",
  assets: "investments",
  moneyGoal: "money_goal",
  moneyFear: "money_fear",
  kids: "children_count",
  savingObstacle: "saving_obstacle",
  endOfMonthFeeling: "biggest_leak",
};

function mergeDayObject(
  target: Record<string, unknown>,
  dayObj: Record<string, unknown>
) {
  for (const [qk, qv] of Object.entries(dayObj)) {
    if (qk.startsWith("_")) continue;
    const nk = FINANCIAL_KEY_ALIASES[qk] ?? qk;
    if (target[nk] === undefined) target[nk] = qv;
  }
}

function normalizeFinancialKeys(
  source: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(source)) {
    if (v == null || v === "" || k.startsWith("_")) continue;
    const nk = FINANCIAL_KEY_ALIASES[k] ?? k;
    if (out[nk] === undefined) out[nk] = v;
  }
  return out;
}

/**
 * מפרק daily_answers מהאפליקציה לתשובות לפי מפתח שאלה.
 * האפליקציה שומרת ימים כ-1..7 (לא day1); CRM תיקן לתמוך בשני הפורמטים.
 */
export function flattenDailyAnswers(
  dailyAnswers: Record<string, unknown> | null | undefined,
  options?: {
    onboardingAnswers?: { question_key: string; answer: string | null }[];
    financialData?: Record<string, unknown> | null;
  }
): Record<string, unknown> {
  const flat: Record<string, unknown> = {};

  if (dailyAnswers?.profile && typeof dailyAnswers.profile === "object") {
    Object.assign(
      flat,
      normalizeFinancialKeys(dailyAnswers.profile as Record<string, unknown>)
    );
  }

  if (dailyAnswers) {
    for (const [key, val] of Object.entries(dailyAnswers)) {
      if (DAILY_ANSWERS_META.has(key)) continue;
      if (/^day\d+$/i.test(key) && val && typeof val === "object") {
        mergeDayObject(flat, val as Record<string, unknown>);
        continue;
      }
      if (/^[1-7]$/.test(key) && val && typeof val === "object") {
        mergeDayObject(flat, val as Record<string, unknown>);
      }
    }
  }

  for (const a of options?.onboardingAnswers ?? []) {
    if (!a.question_key || a.answer == null || a.answer === "") continue;
    const nk = FINANCIAL_KEY_ALIASES[a.question_key] ?? a.question_key;
    if (flat[nk] === undefined) flat[nk] = a.answer;
  }

  if (Object.keys(flat).length === 0 && options?.financialData) {
    Object.assign(flat, normalizeFinancialKeys(options.financialData));
  }

  return flat;
}
