# VerMillion CRM — התקנה על מחשב (Windows)

## למנכ״ל — מה לשלוח

אחרי בניית המתקין בפרויקט, הקובץ להפצה:

```
dist-electron\VerMillion CRM Setup 0.1.0.exe
```

(שם גרסה עשוי להשתנות לפי `package.json` — גם הועתק לשולחן העבודה כ-`VerMillion CRM Setup.exe`.)

שלח את קובץ ה-`.exe` בלבד (~150MB) — **לא** צריך Node.js או תיקיית הפרויקט על המחשב היעד.

---

## התקנה אצל מקבל החבילה

1. הרץ את `VerMillion CRM Setup … .exe`
2. בחר תיקיית התקנה (או ברירת מחדל)
3. סיים התקנה — נוצר קיצור בשולחן העבודה / בתפריט התחל
4. הפעל **VerMillion CRM** — המתן עד 30–60 שניות בפעם הראשונה
5. התחבר עם משתמש מנכ״ל (ראה הגדרה למטה)

---

## הגדרה ראשונה (חובה פעם אחת)

במחשב המותקן, פתח קובץ הגדרות:

```
%APPDATA%\VerMillion CRM\.env
```

(הדבק בחלון «הרץ»: `Win+R` → `%APPDATA%\VerMillion CRM`)

מלא לפחות:

| משתנה | תיאור |
|--------|--------|
| `CRM_ADMIN_USERNAME` | שם משתמש מנכ״ל |
| `CRM_ADMIN_PASSWORD` | סיסמה |
| `VERMILLION_INGESTION_URL` | כתובת Supabase של האפליקציה |
| `VERMILLION_INGESTION_SERVICE_KEY` | מפתח service_role |
| `XAI_API_KEY` | אם משתמשים בסוכני AI |

`AUTH_SECRET` נוצר אוטומטית בהפעלה ראשונה.

**מסד נתונים מקומי:** `%APPDATA%\VerMillion CRM\prisma\dev.db`  
(נוצר מהתבנית בהתקנה ראשונה — כל המחשב שומר נתונים מקומיים לעצמו.)

---

## בניית המתקין (מפתח)

במחשב הפיתוח, מתוך תיקיית הפרויקט:

```powershell
cd c:\Users\97254\Desktop\vermillioncrm
npm install
npm run icon          # אייקון (אופציונלי — כבר מובנה)
npm run electron:build
```

פלט: `dist-electron\VerMillion CRM Setup 0.1.0.exe`

לבדיקה בלי מתקין (תיקייה מפורקת):

```powershell
npm run electron:build:dir
```

---

## פתרון תקלות

| בעיה | פתרון |
|------|--------|
| חלון לא נפתח | המתן דקה; בדוק שאין תוכנה אחרת על פורט 3001 |
| שגיאה בהפעלה | פתח `%APPDATA%\VerMillion CRM` — ודא ש-`.env` קיים |
| אין סנכרון מאפליקציה | מלא Supabase ב-`.env` והפעל מחדש |
| עדכון גרסה | התקן מחדש מעל הגרסה הקודמת — ה-DB ב-AppData נשמר |

---

## הערות אבטחה

- קובץ `.env` על המחשב המותקן מכיל סודות — לא לשתף.
- כל מחשב = מסד SQLite נפרד ב-AppData (לא מסונכרן אוטומטית בין מחשבים).
