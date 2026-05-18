import Link from "next/link";
import { getCeoDashboard } from "@/lib/ceo/queries";
import { getVermillionDashboard } from "@/lib/vermillion/queries";
import { hasLocalAppData, isIngestionConfigured } from "@/lib/vermillion/status";
import { db } from "@/lib/db";
import { VermillionConfigBanner } from "@/components/vermillion/config-banner";
import { AutopilotBar } from "./autopilot-bar";

function formatMoney(n: number) {
  return `₪${n.toLocaleString("he-IL")}`;
}

export async function ExecutiveHome() {
  const ingestionOk = isIngestionConfigured();
  const hasApp = await hasLocalAppData();

  const [appData, ceoData, customers, pipeline, campaigns, income, expenses] =
    await Promise.all([
      hasApp ? getVermillionDashboard() : Promise.resolve(null),
      getCeoDashboard().catch(() => null),
      db.customer.count(),
      db.sale.count({ where: { status: { notIn: ["WON", "LOST"] } } }),
      db.campaign.count({ where: { status: "ACTIVE" } }),
      db.transaction.aggregate({ where: { type: "INCOME" }, _sum: { amount: true } }),
      db.transaction.aggregate({ where: { type: "EXPENSE" }, _sum: { amount: true } }),
    ]);

  const incomeSum = income._sum.amount ?? 0;
  const expenseSum = expenses._sum.amount ?? 0;

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <SectionHeader
          title="מוצר VerMillion"
          subtitle="בסיס המנוי — משתמשים, מעורבות, פרימיום. מסונכרן מאפליקציית הלקוח (מערכת נפרדת)."
          action={{ href: "/vermillion", label: "מרכז מוצר →" }}
        />

        {!ingestionOk ? (
          <VermillionConfigBanner />
        ) : !appData ? (
          <Callout
            tone="warn"
            text="טרם סונכרנו נתוני מוצר. בלי סנכרון אין תמונת MRR ומעורבות אמיתית."
            action={{ href: "/vermillion", label: "סנכרן עכשיו" }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi
              label="משתמשים רשומים"
              value={String(appData.totals.users)}
              sub={`${appData.totals.premium} פרימיום`}
            />
            <Kpi
              label="מעורבות החודש"
              value={String(appData.totals.totalStampsThisMonth)}
              sub="Stamps"
            />
            <Kpi
              label="הגדירו טיימר DNA"
              value={String(appData.totals.withTimerSet)}
              sub="הפעלה"
            />
            <Kpi
              label="הכנסה חודשית (הערכה)"
              value={
                appData.prizePool
                  ? formatMoney(appData.prizePool.monthlyRevenue)
                  : "—"
              }
              highlight
            />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="צוות והנהלה"
          subtitle="עובדים, נוכחות, יעדים וביצועים — מי מוביל ומי דורש תשומת לב היום."
          action={{ href: "/ceo", label: "מרכז מנכ״ל →" }}
        />
        {ceoData ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="עובדים פעילים" value={String(ceoData.activeEmployees)} />
              <Kpi label="עסקאות בצינור (צוות)" value={String(ceoData.openDeals)} />
              <Kpi label="נסגרו החודש" value={String(ceoData.wonDealsMonth)} />
              <Kpi
                label="הכנסות מיוחסות לצוות"
                value={formatMoney(ceoData.salesAmountMonth)}
                highlight
              />
            </div>
            {ceoData.alerts.length > 0 && (
              <Callout
                tone="warn"
                title="דורש טיפול היום"
                text={ceoData.alerts.map((a) => a.message).join(" · ")}
                action={{ href: "/ceo", label: "פתח מרכז מנכ״ל" }}
              />
            )}
            <div className="flex flex-wrap gap-2">
              <QuickLink href="/ceo/attendance" label="יומן נוכחות" />
              <QuickLink href="/ceo/team/new" label="+ עובד חדש" />
              <QuickLink href="/ceo/team" label="כל העובדים" />
            </div>
          </>
        ) : (
          <Callout text="טוען נתוני צוות…" />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="תפעול עסקי"
          subtitle="מכירות, שיווק וכספים שאתה מנהל ב-CRM — לא אותו מספר כמו מנויים באפליקציה."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Kpi label="לידים / לקוחות CRM" value={String(customers)} />
          <Kpi label="עסקאות בצינור" value={String(pipeline)} />
          <Kpi label="קמפיינים פעילים" value={String(campaigns)} />
          <Kpi label="הכנסות רשומות" value={formatMoney(incomeSum)} />
          <Kpi label="הוצאות רשומות" value={formatMoney(expenseSum)} />
          <Kpi
            label="רווח גולמי (רשום)"
            value={formatMoney(incomeSum - expenseSum)}
            highlight={incomeSum >= expenseSum}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickLink href="/sales" label="מכירות" />
          <QuickLink href="/campaigns" label="קמפיינים" />
          <QuickLink href="/finance" label="כספים" />
          <QuickLink href="/whatsapp" label="וואטסאפ" />
        </div>
      </section>

      <section>
        <SectionHeader
          title="פקודה אסטרטגית"
          subtitle="הוראה אחת למערכת — שיווק, מכירות, כספים ומדיה ברצף אוטומטי."
        />
        <AutopilotBar />
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{subtitle}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-[var(--accent)]/40 bg-[var(--accent-dim)]/15"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-white/5"
    >
      {label}
    </Link>
  );
}

function Callout({
  text,
  title,
  tone,
  action,
}: {
  text: string;
  title?: string;
  tone?: "warn";
  action?: { href: string; label: string };
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm ${
        tone === "warn"
          ? "border-amber-700/40 bg-amber-950/20 text-amber-100"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
      }`}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <p>{text}</p>
      {action && (
        <Link href={action.href} className="mt-2 inline-block underline">
          {action.label}
        </Link>
      )}
    </div>
  );
}
