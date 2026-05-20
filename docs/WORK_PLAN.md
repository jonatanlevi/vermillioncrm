# VerMillion CRM — תוכנית עבודה לסיום המערכת

**עודכן:** 20 מאי 2026  

---

## ⚠️ נקודות שימת לב פתוחות — לפני משתמשים אמיתיים

| קובץ | מה לשנות | סיבה |
|------|----------|-------|
| `vermillion/src/screens/vermillion/VerMillionScreen.js` שורה 20 | `DEV_BYPASS_TIMER = false` | **פתוח כרגע לבדיקות (19 מאי 2026)** — חוסם גייט שעת DNA + חסימת stamp. חייב לסגור לפני הכנסת משתמשים אמיתיים! |
| `vermillion/src/screens/onboarding/OnboardingChatScreen.js` | `DEV_NO_QUESTION_LIMIT = false` | אם עדיין true — מסיר מגבלת 3 שאלות ליום |

**אחרי סגירה: `deploy.ps1` מ-`vermillion/`**

---


**פרויקט CRM:** `c:\Users\97254\Desktop\vermillioncrm`  
**אפליקציית VerMillion:** `c:\Users\97254\Desktop\million\vermillion`  
**Supabase project:** `hegbvrvmgvmmbigfpqax`  
**Deploy אפליקציה:** https://vermillion-ashen.vercel.app  

---

## מטרת המערכת

CRM פנימי לניהול עסק VerMillion:
- שיקוף נתוני Supabase (משתמשים, טיימר DNA, stamps, אונבורדינג, AI, כספים)
- 7 סוכני AI (כולל **סוכן מנכ"ל** לניתוח צוות)
- **מודול מנכ"ל (`/ceo`)** — מעקב עובדים, יעדים, פעילות, ביצועים
- אוטומציה מלאה (Grok עכשיו → Claude אחר כך)

**אפיון מודול מנכ"ל:** `docs/CEO_MODULE.md`

---

## סשן 2026-05-20: UI Fixes

| נושא | סטטוס | פירוט |
|------|--------|--------|
| White scrollbar | ✅ | `globals.css` — custom dark scrollbars (Firefox + Webkit) |
| Electric animation — כפתורי רשתות | ✅ | `campaign-network-hub.tsx` — אנימציה בלחיצה בלבד (2.5ש׳), active state לאחר מכן |

---

## סשן 2026-05-18 (ב): RBAC — התחברות והרשאות

| נושא | סטטוס | פירוט |
|------|--------|--------|
| NextAuth + Credentials | ✅ | `src/auth.ts` · CEO מ-`.env` · עובדים מ-`Employee` + bcrypt |
| `accessRole` + `permissions` + `passwordHash` | ✅ | Prisma `Employee` — `role` נשאר תפקיד עבודה |
| Middleware | ✅ | `src/middleware.ts` — routes + `/ceo/employees` ל-CEO בלבד |
| ניהול עובדים | ✅ | `/ceo/employees` · `POST/PATCH/DELETE` `/api/ceo/employees` |
| ניווט דינמי | ✅ | `sidebar.tsx` לפי session |
| `.env` | ידני | `AUTH_SECRET`, `CRM_ADMIN_EMAIL`, `CRM_ADMIN_PASSWORD` |

---

## סשן 2026-05-18: ניהול נטישה

| נושא | סטטוס | פירוט |
|------|--------|--------|
| Realtime sync | ✅ | `VERMILLION_REALTIME_SYNC=true` · האזנה ל-8 טבלאות ב-Supabase (`profiles`, `commitment`, `daily_stamps`, `onboarding_state`, `onboarding_answers`, `chat_history`, `financial_data`, `game_sessions`) · `src/lib/ingestion/realtime-sync.ts` |
| Soft-delete ל-`AppUser` | ✅ | שדה `deletedAt` ב-`prisma/schema.prisma` |
| סנכרון מלא מסמן נטישה | ✅ | ב-`syncAppDataFromSource()` — משתמשים שלא חזרו מהמקור מקבלים `deletedAt`; חוזרים מאפסים `deletedAt` |
| Realtime על מחיקה | ✅ | `removeLocalUser()` — soft delete (לא hard delete) · `userCount` רק לפעילים |
| רשימה פעילה | ✅ | `getVermillionUsersFromStore()` — `where: { deletedAt: null }` |
| משתמשים שנטשו | ✅ | `getChurnedUsersFromStore()` / `getChurnedUsers()` · עמוד `/vermillion/churned` |
| קישור ב-UI | ✅ | `/vermillion/users` → «משתמשים שנטשו →» |
| טבלת משתמשים (responsive) | ✅ | עמודות משניות ב-`md:hidden` — `users-table.tsx` |

**הגדרה חד-פעמית (מחוץ ל-Git):** Realtime בדשבורד Supabase על 8 הטבלאות · `.env` עם `VERMILLION_REALTIME_SYNC=true`

**לא בוצע ב-Git:** `.env`, `prisma/dev.db`

---

## מה כבר בנוי (✅)

| רכיב | סטטוס | מיקום |
|------|--------|--------|
| Next.js 15 + Tailwind | ✅ | שורש הפרויקט |
| Prisma + SQLite מקומי | ✅ | `prisma/schema.prisma` |
| 6 סוכנים + Orchestrator | ✅ | `src/lib/agents/`, `orchestrator.ts` |
| AI Grok + Claude מוכן | ✅ | `src/lib/ai/` |
| GroqProvider (AI חינמי) | ✅ | `src/lib/ai/groq.ts` |
| לוח בקרה + Autopilot | ✅ | `/` |
| דשבורד מנכ"ל (ExecutiveHome) | ✅ | `/` — KPI מוצר + צוות + תפעול |
| קמפיינים — 13 רשתות נפרדות | ✅ | `/campaigns` |
| מכירות + דשבורד | ✅ | `/sales` |
| VerMillion — יניקה + Realtime | ✅ | `/vermillion`, `/vermillion/users`, `/vermillion/churned` |
| מודול מנכ"ל (`/ceo`) | ✅ | KPI צוות + ביצועים + התראות · `docs/CEO_MODULE.md` |
| מרכז AI + מעקב עלויות | ✅ | `/ceo/ai-operations` |
| יומן נוכחות | ✅ | `/ceo/attendance` |
| Live Monitor — פעילות בזמן אמת | ✅ | `/vermillion/live` |
| יומן עבודה (DevLog) | ✅ | `/vermillion/dev-log` |
| מחשבון פרסים דטרמיניסטי | ✅ | `src/lib/vermillion/prize-calc.ts` |
| שכבת ידע מוצר לAI | ✅ | `src/lib/vermillion/product-knowledge.ts` |
| RBAC — CEO + עובדים | ✅ | `src/auth.ts`, `src/middleware.ts` |
| אישור הרשמות עובדים | ✅ | `/ceo/approvals` |
| סוכן ניתוח נתונים | ✅ | `vermillion-agent.ts` |
| תור משימות (jobs) | ✅ בסיס | `src/lib/jobs/` |
| Stubs: WhatsApp, Social | ✅ | `integrations/` |
| UI: Custom scrollbars כהים | ✅ | `globals.css` |
| UI: Electric animation — כפתורי רשתות | ✅ | `campaign-network-hub.tsx` |

---

## מה חסר (סיכום — מצב 20 מאי 2026)

| נושא | עדיפות |
|------|--------|
| **חיבור Supabase אמיתי** (`.env` עם `SUPABASE_SERVICE_ROLE_KEY`) | 🔴 קריטי |
| **אינטגרציות אמיתיות** — WhatsApp (Twilio/Meta), OAuth רשתות, חשבוניות PDF | 🟠 גבוהה |
| **PostgreSQL production** במקום SQLite | 🟠 גבוהה |
| **Cron jobs** — דוחות יומיים, sync מתוזמן | 🟡 בינונית |
| **מדיה וידאו** — Runway / API וידאו | 🟡 בינונית |
| **בדיקות + אבטחה** — RLS, secrets audit, E2E | 🟡 בינונית |
| **מובייל responsive מלא** | 🟢 נמוכה |

---

## שלבי עבודה (לפי סדר ביצוע)

### שלב 0 — הכנה (יום 1) 🔴 עכשיו

- [ ] העתק ל-`vermillioncrm/.env`:
  - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` מפרויקט האפליקציה
  - `XAI_API_KEY` (Grok)
  - `VERMILLION_APP_URL=https://vermillion-ashen.vercel.app`
- [ ] הרץ `npm run dev` — ודא `/vermillion` מציג נתונים אמיתיים
- [ ] פתח workspace עם שתי תיקיות: `vermillioncrm` + `million/vermillion`

**Definition of done:** דשבורד VerMillion מציג מספר משתמשים > 0 (אם יש בפרודקשן).

---

### שלב 1 — Supabase מלא ב-CRM (שבוע 1)

**מטרה:** כל מה ש-Supabase נותן — גלוי וניתן לניתוח ב-CRM.

- [ ] טבלאות נוספות ב-UI:
  - `operational_costs` — עלויות Groq/Vercel
  - `prize_config` — עריכת הגדרות פרסים (read-only או admin)
  - `game_scores` / `game_sessions` — אנגייג'מנט משחקים
- [ ] דף **כספים אמיתי** — משוך מ-Supabase + `/api/prize-pool`
- [ ] פילטרים וחיפוש ב-`/vermillion/users` (מנוי, יש טיימר, ללא stamp)
- [ ] ייצוא CSV למשתמשים
- [ ] שמירת snapshot ב-`VermillionSnapshot` בכל הרצת סוכן ניתוח

**קבצים:** `src/lib/vermillion/queries.ts`, `src/components/vermillion/*`

---

### שלב 1.5 — מודול מנכ"ל / מעקב עובדים (שבוע 1–2) 👔 ✅ הושלם

**מטרה:** אתה כמנכ"ל רואה את כל הצוות — מי עושה מה, מול יעדים.

**אפיון מלא:** `docs/CEO_MODULE.md`

- [x] Prisma: `Employee`, `EmployeeActivity`, `EmployeeGoal`
- [x] קישור: `Sale`, `Campaign`, `AgentRun` → `employeeId`
- [x] `/ceo` — דשבורד (KPI צוות, דירוג, התראות)
- [x] `/ceo/team` + `/ceo/team/[id]`
- [x] `/ceo/activity` — יומן פעילות
- [x] `/ceo/ai-operations` — מרכז AI + עלויות
- [x] `/ceo/attendance` — יומן נוכחות
- [x] סוכן `ceo` — סיכום ניהולי בעברית
- [x] הרשאות: רק CEO רואה `/ceo`
- [ ] `/ceo/goals` — יעדים חודשיים (עדיין חסר)

**לא לבלבל:** עובדים (צוות פנימי) ≠ משתמשי אפליקציה (`/vermillion/users`).

---

### שלב 2 — אימות והרשאות CRM (שבוע 1–2) ✅ הושלם

- [x] התחברות מנהל (NextAuth + Credentials)
- [x] CEO מ-`.env` + עובדים מ-`Employee` + bcrypt
- [x] Middleware — הגנה על routes + `/ceo` ל-CEO בלבד
- [x] RBAC מלא — permissions per agent module

---

### שלב 3 — סוכנים + אוטומציה אמיתית (שבוע 2–3)

**קמפיינים:**
- [ ] חיבור OAuth: Meta (IG+FB), TikTok (לפי זמינות API)
- [ ] תזמון פרסום (`scheduledAt` → cron job)
- [ ] אישור לפני פרסום (אופציונלי) vs מצב אוטומטי מלא

**וואטסאפ:**
- [ ] Twilio או Meta WhatsApp Business API
- [ ] תבניות הודעות + שליחה לפי סגמנט (premium / ללא stamp)

**כספים:**
- [ ] יצירת חשבונית PDF (ספריית PDF)
- [ ] סנכרון הכנסות מ-Supabase subscriptions

**מדיה:**
- [ ] Grok תמונות (קיים) + בדיקת איכות
- [ ] שלב 2: וידאו (Runway / API אחר)

**מכירות:**
- [ ] סנכרון לידים מ-`profiles` חדשים
- [ ] התראות על לידים תקועים

---

### שלב 4 — תזמון ורקע (שבוע 3)

- [ ] Vercel Cron או `node-cron` ל:
  - `processJobQueue()` כל 5 דקות
  - דוח יומי במייל / וואטסאפ למנהל
  - סנכרון מדדי VerMillion
- [x] Realtime מ-Supabase → רענון משתמש ב-CRM (`realtime-sync.ts`, 8 טבלאות)
- [x] Live Monitor — `/vermillion/live` — פעילות משתמשים בזמן אמת
- [ ] Webhook נוסף / edge-export (אופציונלי)

---

### שלב 5 — Production (שבוע 4)

- [ ] PostgreSQL במקום SQLite (`DATABASE_URL` production)
- [ ] Deploy ל-Vercel
- [ ] משתני סביבה ב-Vercel Dashboard
- [ ] `AI_PROVIDER=claude` + בדיקות
- [ ] ניטור שגיאות (Sentry אופציונלי)

---

### שלב 6 — ליטוש (מתמשך)

- [ ] RTL מלא בכל הממשק
- [ ] מובייל responsive
- [ ] בדיקות E2E (Playwright) לזרימות קריטיות
- [ ] תיעוד הפעלה למנהל העסק

---

## מפת קבצים חשובים

```
vermillioncrm/
├── .env                          # סודות — לא ב-Git
├── prisma/schema.prisma          # CRM מקומי (לידים, jobs, snapshots)
├── src/lib/supabase/admin.ts     # חיבור Supabase service role
├── src/lib/vermillion/queries.ts # כל שליפות הנתונים מהאפליקציה
├── src/lib/agents/               # לוגיקת סוכנים
├── src/lib/orchestrator.ts       # pipeline אוטומטי
├── src/app/(app)/                # עמודים
└── docs/ARCHITECTURE.md
```

```
million/vermillion/
├── supabase/schema.sql + migrations/
├── src/services/storage.js       # CRUD אפליקציה
├── api/prize-pool.js             # כלכלה
└── App.js
```

---

## טבלאות Supabase (מקור האמת)

| טבלה | שימוש ב-CRM |
|------|-------------|
| `profiles` | משתמשים, מנוי |
| `commitment` | טיימר DNA + streak |
| `daily_stamps` | תחרות, ניקוד |
| `onboarding_*` | מסע התחלה |
| `chat_history` | שימוש AI |
| `financial_data` | פרופיל פיננסי |
| `game_sessions` | משחקים |
| `operational_costs` | עלויות |
| `prize_config` | פרסים ומחיר |

---

## החלטות טכניות (לא לשנות בלי סיבה)

| נושא | החלטה |
|------|--------|
| ארכיטקטורה | Modular Monolith (Next.js) |
| נתוני אפליקציה | יניקה חד-כיוונית מ-Supabase → `AppUser` מקומי (ADR-002) |
| CRM מקומי | Prisma SQLite — `AppUser`, jobs, לידים פנימיים; soft-delete ב-`deletedAt` |
| AI עכשיו | Grok (`XAI_API_KEY`) |
| AI אחר כך | `AI_PROVIDER=claude` |
| פרסום stamps | רק דרך Edge Functions באפליקציה — CRM לא כותב stamps |

---

## פקודות שימושיות

```bash
cd c:\Users\97254\Desktop\vermillioncrm
npm run dev
npm run db:push
npm run build
```

---

## קריטריון "המערכת מוכנה"

1. מנכ"ל מתחבר ל-CRM מאובטח
2. **`/ceo`** — רואה ביצועי כל העובדים, יעדים, פעילות
3. רואה את כל משתמשי VerMillion + טיימרים + stamps (`/vermillion`)
4. מריץ סוכנים (כולל סוכן מנכ"ל) ומקבל המלצות בעברית
5. יוצר קמפיין + מדיה + וואטסאפ — מיוחס לעובד
6. דשבורד מכירות וכספים אמיתיים
7. הכל ב-production
