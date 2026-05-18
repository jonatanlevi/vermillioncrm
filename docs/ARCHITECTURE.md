# VerMillion CRM — Architecture

## Context

CRM that monitors the **VerMillion** app and automates: social campaigns, finance, WhatsApp, sales/ops, media production — via connected AI agents.

**Constraints (MVP):** Grok (xAI) now → Claude later; modular monolith; single team.

## Recommendation: Modular Monolith (Next.js)

| Layer | Path | Role |
|-------|------|------|
| UI | `src/app/(app)/*` | One page per agent module |
| API | `src/app/api/*` | Agent run, pipeline, jobs |
| Agents | `src/lib/agents/*` | Domain logic per agent |
| AI | `src/lib/ai/*` | Provider swap: Grok ↔ Claude |
| Jobs | `src/lib/jobs/*` | Async chain between agents |
| Integrations | `src/lib/integrations/*` | WhatsApp, social, VerMillion API |
| Data | `prisma/schema.prisma` | SQLite dev → PostgreSQL prod |
| Ingestion | `src/lib/ingestion/` | חד-כיווני: אפליקציה → CRM (לא Supabase משותף) |

## Agent map

```
┌─────────────────────────────────────────────────────────┐
│                    Orchestrator                          │
│  runAgent() │ runAutonomousPipeline() │ Job queue       │
└──────────┬──────────────────────────────────────────────┘
           │
    ┌──────┴──────┬──────────┬─────────┬────────┬────────────┐
    ▼             ▼          ▼         ▼        ▼            ▼
Campaigns    Finance    WhatsApp   Sales    Media    VerMillion
    │             │          │         │        │            │
    └─────► media.generate ──┴─────────┴────────┴──► social.publish
```

## Data ingestion (ADR-002)

האפליקציה (VerMillion) וה-CRM הן **שתי מערכות נפרדות**.

- האפליקציה כותבת ל-Supabase שלה.
- ה-CRM **מייבא** (יניקה) נתונים ל-`AppUser` / `AppSyncMeta` ב-Prisma — **קריאה בלבד** מהמקור.
- UI, סוכנים ודוחות קוראים **רק** מהמסד המקומי.
- `POST /api/app/sync` מפעיל יניקה; אין קריאות למקור מעמודי UI.

```
אפליקציה → [מקור חיצוני] ──יניקה──► Prisma (CRM) ──► ממשק / סוכנים
```

## Phase roadmap

1. **Phase 1 (now):** Skeleton, DB, agents, Grok, stubs for WhatsApp/social
2. **Phase 2:** Real VerMillion API, WhatsApp (Twilio/Meta), OAuth social
3. **Phase 3:** Switch `AI_PROVIDER=claude`, video generation, scheduling cron
4. **Phase 4:** Auth, multi-tenant, PostgreSQL, production deploy

## Switch AI provider

```env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...
```

No code changes required — `getAIProvider()` resolves at runtime.
