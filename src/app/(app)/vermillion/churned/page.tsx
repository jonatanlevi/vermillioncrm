import Link from "next/link";
import {
  getChurnedUsers,
  getCeoDeletedUsers,
  formatTimer,
  type RemovedAppUserRow,
} from "@/lib/vermillion/queries";

export const dynamic = "force-dynamic";

export default async function ChurnedUsersPage() {
  const [churned, ceoDeleted] = await Promise.all([
    getChurnedUsers(),
    getCeoDeletedUsers(),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">משתמשים לא פעילים</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            נטשו: {churned.length} · נמחקו על ידי מנכ״ל: {ceoDeleted.length}
          </p>
        </div>
        <Link
          href="/vermillion/users"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← משתמשים פעילים
        </Link>
      </header>

      <RemovedSection
        title="משתמשים שנטשו"
        description="חשבונות שנעלמו מהאפליקציה (מחיקה או יציאה) — לא נמחקו ידנית מה-CRM"
        emptyText="אין משתמשים שנטשו עדיין"
        users={churned}
        badge={{ label: "נטש", className: "bg-zinc-800 text-zinc-400" }}
      />

      <RemovedSection
        title="נמחקו על ידי מנכ״ל"
        description="נמחקו מ-Supabase בפעולת מחיקה מה-CRM — העותק המקומי נשמר לצפייה"
        emptyText="אין משתמשים שנמחקו ידנית"
        users={ceoDeleted}
        badge={{
          label: "מחיקת מנכ״ל",
          className: "bg-red-950/60 text-red-300 ring-1 ring-red-900/50",
        }}
      />
    </div>
  );
}

function RemovedSection({
  title,
  description,
  emptyText,
  users,
  badge,
}: {
  title: string;
  description: string;
  emptyText: string;
  users: RemovedAppUserRow[];
  badge: { label: string; className: string };
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs text-[var(--muted)]">{description}</p>
      </div>
      {users.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
          {emptyText}
        </div>
      ) : (
        <RemovedUsersTable users={users} badge={badge} />
      )}
    </section>
  );
}

function RemovedUsersTable({
  users,
  badge,
}: {
  users: RemovedAppUserRow[];
  badge: { label: string; className: string };
}) {
  return (
    <div className="max-w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]" dir="rtl">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-black/20 text-[var(--muted)]">
            <th className="px-3 py-3 text-right">סוג</th>
            <th className="px-3 py-3 text-right">משתמש</th>
            <th className="px-3 py-3 text-right">טלפון</th>
            <th className="px-3 py-3 text-right">מנוי</th>
            <th className="px-3 py-3 text-right">טיימר DNA</th>
            <th className="hidden md:table-cell px-3 py-3 text-right">Stamps</th>
            <th className="hidden md:table-cell px-3 py-3 text-right">תאריך</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const c = u.commitment;
            const timer = formatTimer(c?.committed_hour, c?.committed_minute);

            return (
              <tr
                key={u.id}
                className="border-b border-[var(--border)]/40 opacity-70 hover:opacity-90"
              >
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/vermillion/users/${u.id}`}
                    className="font-medium text-[var(--muted)] line-through hover:text-[var(--accent)] hover:no-underline"
                  >
                    {u.name || u.email || u.id.slice(0, 12)}
                  </Link>
                  <div className="text-xs text-[var(--muted)]/60">{u.email}</div>
                </td>
                <td className="px-3 py-2 text-[var(--muted)]">{u.phone ?? "—"}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                    {u.subscription}
                  </span>
                </td>
                <td className="px-3 py-2 text-[var(--muted)]">{timer ?? "—"}</td>
                <td className="hidden md:table-cell px-3 py-2 text-[var(--muted)]">
                  {u.stampsThisMonth}
                </td>
                <td className="hidden md:table-cell px-3 py-2 text-xs text-red-400/90">
                  {new Date(u.deletedAt).toLocaleDateString("he-IL")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
