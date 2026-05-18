import Link from "next/link";
import { getVermillionDashboard } from "@/lib/vermillion/queries";
import { hasLocalAppData, isIngestionConfigured } from "@/lib/vermillion/status";
import { VermillionConfigBanner } from "@/components/vermillion/config-banner";

export async function HomeOverview() {
  const ingestionOk = isIngestionConfigured();
  const hasData = await hasLocalAppData();

  if (!ingestionOk) {
    return (
      <section className="space-y-4">
        <VermillionConfigBanner />
        <p className="text-sm text-[var(--muted)]">
          הלוח למטה הוא CRM מקומי. כדי לראות משתמשי האפליקציה — הגדר מקור יניקה וסנכרן
          מעמוד משתמשי האפליקציה.
        </p>
      </section>
    );
  }

  if (!hasData) {
    return (
      <section className="space-y-4">
        <p className="text-sm text-amber-200">
          מקור היניקה מוגדר — טרם סונכרן.{" "}
          <Link href="/vermillion" className="underline">
            לחץ כאן לסנכרון
          </Link>
        </p>
      </section>
    );
  }

  const data = await getVermillionDashboard();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">משתמשי האפליקציה</h2>
          <p className="text-sm text-[var(--muted)]">
            עותק מקומי (לא מסד משותף). חודש: {data.monthKey}
          </p>
        </div>
        <Link
          href="/vermillion/users"
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
        >
          צפה בכל המשתמשים →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="משתמשים באפליקציה" value={data.totals.users} />
        <MiniStat label="מנוי פרימיום" value={data.totals.premium} />
        <MiniStat label="הגדירו טיימר DNA" value={data.totals.withTimerSet} />
        <MiniStat label="Stamps החודש" value={data.totals.totalStampsThisMonth} />
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-dim)]/10 p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
