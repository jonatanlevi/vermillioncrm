# מודול מנכ"ל — מעקב עובדים (אפיון)

**סטטוס:** MVP מיושם (`/ceo`, `/ceo/team`, `/ceo/activity`)  
**קהל:** מנכ"ל (אתה) — תצוגת על, לא תצוגת עובד  
**ADR-001:** נתוני עובדים ב-Prisma (CRM), לא במקור האפליקציה  
**ADR-002:** נתוני משתמשי אפליקציה — יניקה ל-`AppUser` (Prisma), לא חיבור Supabase משותף (`docs/ARCHITECTURE.md`)  

---

## Context

### הבעיה
ה-CRM עוקב אחר **לקוחות האפליקציה** (Supabase `profiles`), אבל לא אחר **הצוות הפנימי** שמריץ מכירות, קמפיינים, וואטסאפ וכספים.

מנכ"ל צריך לראות במקום אחד:
- מי עובד על מה
- ביצועים מול יעדים
- פעילות ב-CRM (סוכנים, עסקאות, הודעות)
- מי מפגר / מצטיין

### Requirements (Functional)

| # | דרישה |
|---|--------|
| F1 | רשימת עובדים + תפקיד + מחלקה + סטטוס (פעיל/חופשה) |
| F2 | דשבורד מנכ"ל — KPI צוות בזמן אמת |
| F3 | ייחוס פעולות: מכירה, קמפיין, וואטסאפ, הרצת סוכן → עובד |
| F4 | יומן פעילות (audit) — מי עשה מה ומתי |
| F5 | יעדים חודשיים לעובד + ביצוע בפועל |
| F6 | התראות: עובד ללא פעילות, יעד חסר, עסקה תקועה |
| F7 | סוכן AI למנכ"ל — סיכום שבועי והמלצות ניהוליות |
| F8 | הרשאות: מנכ"ל רואה הכל; עובד רואה רק את עצמו |

### Non-Functional

| # | דרישה |
|---|--------|
| NF1 | עברית RTL |
| NF2 | טעינת דשבורד < 3 שניות (עד 50 עובדים) |
| NF3 | Audit log לא ניתן למחיקה על ידי עובד |
| NF4 | מוכן ל-PostgreSQL בפרודקשן |

### Constraints

- צוות קטן (1–15 עובדים בהתחלה)
- אין מערכת HR חיצונית (בינתיים)
- לא לערבב `profiles` (לקוחות אפליקציה) עם `employees` (צוות פנימי)

---

## Options Considered

### Option A: הכל ב-Prisma (CRM מקומי) — מומלץ

- **How:** טבלאות `Employee`, `EmployeeActivity`, `EmployeeGoal`; קישור ל-`Sale`, `Campaign`, `AgentRun`
- **Pros:** פשוט, מהיר לבנות, לא תלוי ב-Supabase אפליקציה, שליטה מלאה
- **Cons:** נתונים לא מסתנכרנים אם יש HR חיצוני בעתיד
- **When:** צוות פנימי קטן, MVP

### Option B: טבלת `employees` ב-Supabase האפליקציה

- **Pros:** DB אחד
- **Cons:** ערבוב לקוחות/עובדים, RLS מסובך, סיכון אבטחה
- **When:** לא מומלץ

### Option C: מערכת HR חיצונית (Monday / Notion API)

- **Pros:** פיצ'רים HR מוכנים
- **Cons:** עלות, אינטגרציה, לא אחיד עם CRM
- **When:** 30+ עובדים + מחלקת HR

---

## Recommendation

**Choose: Option A — Prisma ב-CRM**

**Why:** הפרדה ברורה בין לקוחות אפליקציה (Supabase) לצוות פנימי (CRM). מתאים לסקלה שלך ולמהירות פיתוח.

---

## מודל נתונים (מתוכנן)

```prisma
model Employee {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  role         String   // CEO | SALES | MARKETING | FINANCE | SUPPORT | OPS
  department   String?
  phone        String?
  status       String   @default("ACTIVE") // ACTIVE | ON_LEAVE | INACTIVE
  hiredAt      DateTime?
  managerId    String?  // מנהל ישיר
  crmUserId    String?  // קישור ל-auth בעתיד
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  activities   EmployeeActivity[]
  goals        EmployeeGoal[]
  sales        Sale[]           // assignedEmployeeId על Sale
}

model EmployeeActivity {
  id         String   @id @default(cuid())
  employeeId String
  employee   Employee @relation(...)
  action     String   // AGENT_RUN | SALE_CREATED | CAMPAIGN_CREATED | WHATSAPP_SENT | LOGIN
  entityType String?  // sale | campaign | agent_run
  entityId   String?
  metadata   String   @default("{}")
  createdAt  DateTime @default(now())
}

model EmployeeGoal {
  id          String   @id @default(cuid())
  employeeId  String
  monthKey    String   // YYYY-MM
  metric      String   // sales_amount | deals_closed | campaigns | whatsapp_sent
  targetValue Float
  actualValue Float    @default(0)
}
```

**שינויים בטבלאות קיימות:**
- `Sale.assignedEmployeeId`
- `Campaign.ownerEmployeeId`
- `AgentRun.employeeId`
- `WhatsappMessage.sentByEmployeeId`

---

## מסכים (Routes)

| נתיב | תוכן | מי רואה |
|------|------|---------|
| `/ceo` | דשבורד מנכ"ל ראשי | CEO |
| `/ceo/team` | רשימת עובדים + סינון מחלקה | CEO |
| `/ceo/team/[id]` | כרטיס עובד: KPI, יעדים, פעילות, עסקאות | CEO / העובד עצמו |
| `/ceo/activity` | יומן פעילות מלא (פילטרים) | CEO |
| `/ceo/goals` | הגדרת יעדים חודשיים לצוות | CEO |
| `/ceo/reports` | דוחות: השוואת עובדים, ייצוא | CEO |

---

## דשבורד מנכ"ל — וידג'טים

### שורה 1 — KPI צוות (היום / החודש)
- סה״כ עובדים פעילים
- עסקאות פתוחות / נסגרו החודש
- הכנסות מיוחסות לצוות (מ-`Sale` + Supabase premium)
- קמפיינים שנוצרו
- הודעות וואטסאפ נשלחו
- הרצות סוכן AI

### שורה 2 — ביצועי עובדים (טבלה + דירוג)
| עובד | תפקיד | עסקאות | סכום | קמפיינים | וואטסאפ | סוכנים | יעד % |
|------|--------|---------|------|-----------|---------|--------|-------|

### שורה 3 — התראות מנכ"ל
- עובד ללא פעילות 3+ ימים
- יעד חודשי מתחת ל-50%
- עסקאות ללא עדכון 7+ ימים (קישור ל-sales)

### שורה 4 — פעילות אחרונה (timeline)
- "דני הריץ סוכן קמפיינים — לפני 12 דק׳"
- "מיכל סגרה עסקה ₪5,000 — לפני שעה"

### שורה 5 — סוכן AI למנכ"ל
- שאלה: "תסכם לי את הביצועים השבוע ומי צריך תשומת לב"
- קלט: snapshot מכל `EmployeeActivity` + מכירות + יעדים

---

## סוכן חדש: `ceo` (סוכן מנכ"ל)

| שדה | ערך |
|-----|-----|
| ID | `ceo` |
| עמוד | `/ceo` |
| תפקיד | ניתוח צוות, המלצות ניהוליות, זיהוי צווארי בקבוק |
| קלט | JSON מ-`getCeoDashboardSnapshot()` |
| לא נוגע | Supabase לקוחות (זה `vermillion` agent) |

---

## הרשאות (Roles)

| Role | הרשאות |
|------|---------|
| `CEO` | הכל + `/ceo/*` |
| `MANAGER` | צוות שלו + מכירות/קמפיינים |
| `EMPLOYEE` | דף אישי + מודולים לפי תפקיד |
| `ADMIN` | טכני (אופציונלי) |

מימוש: NextAuth / Supabase Auth + `Employee.role` + middleware ב-`/ceo`.

---

## אינטגרציה עם מודולים קיימים

```
עובד מריץ סוכן ב-/campaigns
    → AgentRun.employeeId = X
    → EmployeeActivity.log(AGENT_RUN)

עובד סוגר עסקה ב-/sales
    → Sale.assignedEmployeeId = X
    → EmployeeActivity.log(SALE_WON)

מנכ"ל נכנס ל-/ceo
    → אגרגציה מ-Prisma + Supabase (הכנסות אפליקציה)
```

---

## סיכון ומיטיגציה

| סיכון | מיטיגציה |
|--------|-----------|
| עובד לא מייחס פעולות לעצמו | ברירת מחדל: `employeeId` מ-session |
| זליגת נתונים בין עובדים | Middleware + בדיקת role |
| דשבורד כבד | אגרגציה ב-server, cache 60s |
| בלבול לקוח/עובד | שמות ברורים ב-UI: "צוות" vs "משתמשי אפליקציה" |

---

## שלבי יישום (כשתאשר)

### Phase CEO-1 (שבוע 1)
- [ ] Prisma models + migration
- [ ] Seed: מנכ"ל + 2–3 עובדים לדוגמה
- [ ] `/ceo` דשבורד בסיסי
- [ ] `/ceo/team` רשימה

### Phase CEO-2 (שבוע 2)
- [ ] ייחוס פעולות אוטומטי (AgentRun, Sale)
- [ ] `/ceo/team/[id]` + activity log
- [ ] יעדים חודשיים

### Phase CEO-3 (שבוע 2–3)
- [ ] סוכן `ceo` + התראות
- [ ] Auth + הרשאות CEO only
- [ ] דוחות + ייצוא

---

## קריטריון הצלחה

מנכ"ל נכנס ל-`/ceo` ותוך 30 שניות יודע:
1. כמה עובדים פעילים היום
2. מי המוביל / מפגר החודש
3. מה נעשה אתמול ב-CRM
4. על מה להתריע לעובד מחר
