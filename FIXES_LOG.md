# VerMillion — Fixes Log

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
