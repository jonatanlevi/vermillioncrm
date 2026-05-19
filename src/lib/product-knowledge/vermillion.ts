/**
 * מקור ידע מוצר VerMillion ל-CRM ולסוכני AI.
 * מסונכרן עם: אפליקציה (million/vermillion) — PRODUCT_CONTRACT, LEGAL_SYSTEM_SPEC, GamesScreen, regulationsHe.
 * עדכון ידני כשמשתנה חוזה המוצר באפליקציה.
 */

export const PRODUCT_KNOWLEDGE_VERSION = "2026-05-19";

/** 31 משחקים — מפתח → שם עברי (מ-GamesScreen.js) */
export const VERMILLION_GAMES: { key: string; label: string; category: string }[] = [
  { key: "runner", label: "ריצת VerMillion", category: "ריכוז" },
  { key: "breakout", label: "שבור את החובות", category: "הגיון" },
  { key: "obstacle", label: "מרוץ המכשולים", category: "ריכוז" },
  { key: "bubblepop", label: "פוצץ את הבזבוזים", category: "ריכוז" },
  { key: "reflex", label: "רפלקסים פיננסיים", category: "תגובה" },
  { key: "timing", label: "דיוק המשקיע", category: "תגובה" },
  { key: "speedtap", label: "מהירות הכסף", category: "תגובה" },
  { key: "stack", label: "מגדל החיסכון", category: "הגיון" },
  { key: "catch", label: "לכוד הזדמנויות", category: "ריכוז" },
  { key: "taprhythm", label: "קצב המשקיע", category: "תגובה" },
  { key: "pingpong", label: "מנצח הריבית", category: "ריכוז" },
  { key: "memorytap", label: "זיכרון פיננסי", category: "זיכרון" },
  { key: "colorboom", label: "פוצץ הנכון", category: "זיכרון" },
  { key: "whackmole", label: "הכה את החובות", category: "ריכוז" },
  { key: "dodge", label: "חמוק מהחובות", category: "ריכוז" },
  { key: "bullseye", label: "מרכז העניינים", category: "תגובה" },
  { key: "sort", label: "מיין את הכסף", category: "הגיון" },
  { key: "mathsprint", label: "חשבון מהיר", category: "הגיון" },
  { key: "cardflip", label: "זיכרון זוגות", category: "זיכרון" },
  { key: "safecracker", label: "פצח את הכספת", category: "תגובה" },
  { key: "wordsnap", label: "חיובי / שלילי", category: "ריכוז" },
  { key: "taporder", label: "סדר עולה", category: "הגיון" },
  { key: "numberline", label: "קו מספרים", category: "תגובה" },
  { key: "stockticker", label: "מסחר מהיר", category: "הגיון" },
  { key: "pincrack", label: "פצח את הקוד", category: "זיכרון" },
  { key: "scale", label: "מאזניים", category: "הגיון" },
  { key: "chaintap", label: "שרשרת מספרים", category: "תגובה" },
  { key: "flashcount", label: "ספור מהיר", category: "זיכרון" },
  { key: "speedmatch", label: "התאמה מהירה", category: "ריכוז" },
  { key: "mathchain", label: "שרשרת חשבון", category: "הגיון" },
  { key: "diceadd", label: "קוביות מהיר", category: "הגיון" },
];

export const GAME_CATEGORIES = [
  { id: "memory", label: "זיכרון", games: ["memorytap", "colorboom", "cardflip", "pincrack", "flashcount"] },
  { id: "logic", label: "הגיון", games: ["sort", "stack", "breakout", "mathsprint", "taporder", "stockticker", "scale", "mathchain", "diceadd"] },
  { id: "reflex", label: "תגובה", games: ["reflex", "speedtap", "timing", "bullseye", "taprhythm", "safecracker", "numberline", "chaintap"] },
  { id: "focus", label: "ריכוז", games: ["runner", "obstacle", "bubblepop", "catch", "pingpong", "dodge", "whackmole", "wordsnap", "speedmatch"] },
];

/** משחק יומי לפי יום בחודש (מחזור 31) */
export const DAILY_GAME_SCHEDULE_KEYS = [
  "memorytap", "reflex", "sort", "runner", "colorboom",
  "speedtap", "breakout", "obstacle", "timing", "stack",
  "bubblepop", "bullseye", "catch", "taprhythm", "pingpong",
  "dodge", "whackmole", "mathsprint", "cardflip", "safecracker",
  "wordsnap", "taporder", "numberline", "stockticker", "pincrack",
  "scale", "chaintap", "flashcount", "speedmatch", "mathchain", "diceadd",
];

export const PRODUCT_KNOWLEDGE_BRIEF = `
VerMillion — אפליקציית אימון פיננסי + משחקים יומיים + תחרות חודשית (ישראל/גלובלי).
זרימה: משחק מאומת (game-complete) → Token → חתימה Stamp (שרת) → daily_stamps → לוח דירוג.
DNA יומי (א׳–ה׳+ראשון): שעה שנקבעת בהרשמה, נעולה לצמיתות. ניקוד = קרבה לשעת DNA (ms_diff).
שישי: אתגר 00:01–15:30, DNA יומי לא פעיל, יעד friday_target ננעל בבחירה ראשונה.
שבת: אתגר 21:00–23:59, יעד saturday_target ננעל בבחירה ראשונה.
שעון: תמיד שעון מכשיר (client_timezone) — לא שעון ישראל גלובלי.
מנוי premium: אונבורדינג 7 ימים, ימים 9–30 אימון, תחרות ופרסים. free: מוגבל.
פרס: N×₪99 − תפעול → 50% קרן (÷4 שבועות, 5 זוכים: 35/25/20/12/8%) + 50% רווח מועדון; ≥7 חתימות/חודש.
Anti-cheat: אין stamp בלי token_used; game_sessions בלי גישת לקוח; משחק קצר מדי = GAME_TOO_FAST.
אין ייעוץ פיננסי מורשה — אימון והשכלה בלבד.
`.trim();

export const PRODUCT_KNOWLEDGE_FULL = `
# VerMillion — ידע מוצר מלא (גרסה ${PRODUCT_KNOWLEDGE_VERSION})

## מה זה
פלטפורמת אימון פיננסי אישי: משחקים יומיים, חתימה (Stamp) בזמן DNA, תחרות חודשית עם קופת פרסים דינמית.
לא ייעוץ השקעות מורשה. תוכן = אימון והשכלה.

## מסלול משתמש
1. הרשמה (Google/אימייל) → השלמת פרופיל
2. אונבורדינג ימים 1–7: 21 שאלות פיננסיות (3 ליום) — הכנסה, הוצאות, חובות, חיסכון, מטרות
3. קביעת DNA יומי (שעה) — **נעול לצמיתות** (DB trigger + אפליקציה)
4. ימי חול: משחק → Token → Stamp קרוב ל-DNA
5. שישי ראשון: בחירת שעת אתגר בתוך 00:01–15:30 → נעול friday_target_*
6. שבת ראשונה: בחירת שעת אתגר בתוך 21:00–23:59 → נעול saturday_target_*
7. ימים 9–30 (premium): daily_logs — אימון, אתגר, מכפיל
8. תחרות: ניקוד מצטבר בחודש, לוח מובילים, פרס שבועי ל-5 הראשונים

## DNA וחלונות זמן
| יום | חלון (שעון מכשיר) | DNA יומי |
|-----|-------------------|----------|
| א׳–ה׳ | כל היום (חתימה ליד DNA) | committed_hour/minute |
| שישי (5) | 00:01 – 15:30 | לא — רק friday_target |
| שבת (6) | 21:00 – 23:59 | לא — רק saturday_target |
| ראשון (0) | חוזר ל-DNA יומי | כן |

נוסחת ניקוד (שרת): score = max(1, round(1000 * (1 - ms_diff / 86400000)))
ms_diff = מרחק בדקות בין «עכשיו» לשעת היעד באותו יום מקומי.

## זרימת Anti-Cheat (חובה להבין ניתוח)
משחק נגמר → Edge Function game-complete (JWT + APP_SECRET, duration_ms מינימום, session ≤30 דק׳)
→ upsert game_sessions (game_key, game_score, token, token_used=false)
→ משתמש לוחץ Stamp → Edge Function stamp (client_timezone, חלון, שריפת token אטומית)
→ INSERT daily_stamps
כשל stamp → rollback token_used.
אסור: stamp בלי משחק; חתימה מוצלחת מקומית כששרת נכשל; שימוש ב-profile.timezone לפתיחת חלון (רק מכשיר).

שגיאות: GAME_TOKEN_REQUIRED, WINDOW_CLOSED, CHALLENGE_TIME_REQUIRED, DNA_LOCKED, GAME_TOO_FAST, INVALID_TOKEN.

## מנוי
- free: גישה מוגבלת (ללא מסלול premium מלא)
- premium: ₪99/חודש (ברירת מחדל prize_config), אונבורדינג, ימים 9–30, תחרות ופרסים
- רק premium פעיל ומשלם זכאי לפרס (לפי תקנון)

## קופת פרסים — מנגנון מלא (PRODUCT_SPEC.html)
מקור אפיון: PRODUCT_SPEC.html (million/PRODUCT_SPEC) §4

זרימה: N×₪99 → מינוס תפעול (~₪5/משתמש במסמך, או % ב-prize_config) → **נטו**
→ **50% קרן פרסים** (÷4 שבועות, 5 זוכים/שבוע) + **50% רווח מועדון**

חלוקת קופה שבועית בין 5 מקומות (LeaderboardScreen): 35% | 25% | 20% | 12% | 8%

טבלת דוגמאות לפי קהילה (מהאפיון):
| משתמשים | קרן שבועית | מקום1 | מקום2 | מקום3 | מקום4 | מקום5 |
| 50 | ₪550 | ₪193 | ₪138 | ₪110 | ₪66 | ₪44 |
| 200 | ₪2,350 | ₪822 | ₪588 | ₪470 | ₪282 | ₪188 |
| 500 | ₪5,938 | ₪2,078 | ₪1,485 | ₪1,188 | ₪713 | ₪475 |
| 1,000 | ₪11,938 | ₪4,178 | ₪2,985 | ₪2,388 | ₪1,433 | ₪955 |
| 5,000 | ₪60,000 | ₪21,000 | ₪15,000 | ₪12,000 | ₪7,200 | ₪4,800 |

*הפרסים גדלים עם הקהילה — לכל משתמש אינטרס להביא חברים.*

תנאי זכאות: premium פעיל; ≥7 חתימות/חודש; חתימות מאומתות בשרת; top 5 בניקוד שבועי.
שוויון ניקוד: קרוב יותר ל-DNA/יעד אתגר מנצח.
חישוב חי בזמן ריצת סוכן: מספר premium במראה + prize_config (ראה הקשר פרס חי).

## משחקים (${VERMILLION_GAMES.length} סוגים, 4 קטגוריות)
קטגוריות: זיכרון, הגיון, תגובה, ריכוז.
משחק היום בחודש: מחזור 31 לפי יום בחודש (DAILY_GAME_SCHEDULE).
רשימה: ${VERMILLION_GAMES.map((g) => `${g.key}=${g.label}`).join("; ")}

## מיפוי נתונים ב-CRM (אחרי יניקה מ-Supabase)
| שדה CRM | משמעות מוצר |
|---------|-------------|
| AppUser.profileJson | פרופיל: מנוי, שפה, onboarding_complete, v_coins, timezone |
| commitmentJson | DNA יומי + streak + יעדי שישי/שבת |
| metricsJson | סיכום: stamps החודש, ניקוד, onboardingDays, צ׳אט |
| detailJson.recent_stamps | חתימות — ms_diff, score |
| detailJson.game_sessions | game_key, token_used (הונאה אם stamp בלי token_used) |
| detailJson.daily_logs | ימים 9–30: coaching, challenge_done, multiplier |
| detailJson.onboarding_answers | שאלון ימים 1–7 |
| detailJson.financial_data | פרופיל פיננסי מסוכם |
| detailJson.chat_messages / ai_memory | יועץ AI באפליקציה |
| detailJson.auth_meta | הרשמה, התחברות אחרונה (ברענון משתמש) |

## איך לנתח נכון (הנחיות לסוכן)
- «בסיכון נטישה»: onboarding_complete אבל 0 stamps החודש — לא בהכרח הונאה
- «הונאה חשודה»: stamps החודש > 0 אבל game_sessions עם token_used=false או בלי game_sessions
- «פרימיום פוטנציאלי»: free + engagement גבוה (stamps, צ׳אט, onboarding מלא)
- שישי/שבת: אל תשווה ל-DNA יומי — בדוק friday/saturday targets וחלון
- אין MRR אמיתי עדיין אם אין Stripe — premium בפרופיל ≠ תשלום אמיתי בהכרח

## תקנון (תמצית משפטית)
גרסת תקנון: ${PRODUCT_KNOWLEDGE_VERSION}
- אין ייעוץ מורשה; אחריות המשתמש על החלטות
- מנוי מתחדש עד ביטול; אין החזר חלקי
- פסילה על עקיפת anti-cheat
- מס: אחריות הזוכה; חברה עשויה לנכות במקור
- פרטיות: timezone ומשחקים נשמרים; לא מכירת מידע לצד ג׳
`.trim();
