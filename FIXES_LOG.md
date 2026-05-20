# VerMillion — Fixes Log

## 2026-05-20 — UI: White Scrollbar + Electric Animation

**קבצים:**
- `src/app/globals.css` — Custom dark scrollbars (Firefox + Webkit), הסרת הסרגל הלבן ב-overflow-auto
- `src/components/campaigns/campaign-network-hub.tsx` — אפקט חשמלי על כפתורי רשתות חברתיות

**תיאור:**
1. **White bar**: הסרגל הלבן שהופיע בדפדפן על אלמנטים עם `overflow-auto` (main content) — תוקן עם custom scrollbar CSS
2. **Electric effect**: כפתורי הרשתות (אינסטגרם, טיקטוק וכו') עכשיו מציגים אנימציית box-shadow חשמלית (2.5 שניות) בלחיצה, ואז נשארים ב-active state. לחיצה על כפתור אחר מאפסת את הקודם

**Deployed:** branch `main` → Vercel (auto-deploy)

---

## 2026-05-19 — "פרופיל ריק" Bug Fix

**תסמין:** AI תמיד אמר "פרופיל ריק — מה ההכנסה שלך?" למרות שהמשתמש השלים אונבורדינג מלא.

**root cause:**
האונבורדינג שמר נתונים בפורמט חדש:
```json
{ "profile": { "netIncome": 7000, "fixedExpenses": 4500, ... }, "daysCompleted": [1,2,3,4,5,6,7] }
```
אבל `calcCompletion` + `computeFinancialMetrics` ציפו לפורמט ישן:
```json
{ "day1": { "net_income": 7000 }, "day2": {...} }
```
→ completion = 0 → "פרופיל ריק"
→ metrics = כולם אפס → ה-AI עבד בחושך

**קבצים שתוקנו:**
- `src/services/aiPrompts.js` — נוספו `_flattenAnswers` + `_getCompletion` + `_getMetrics`
- `src/services/agents/index.js` — נוסף `totalDebt: 'loans_total'`, completion fallback 10→3, קריאה מ-`dailyAnswers.profile`

**Deployed:** vermillion-ashen.vercel.app (2026-05-19)
