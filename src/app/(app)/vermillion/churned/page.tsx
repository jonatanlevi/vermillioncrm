import Link from "next/link";
import { getChurnedUsers, formatTimer } from "@/lib/vermillion/queries";

export const dynamic = "force-dynamic";

export default async function ChurnedUsersPage() {
  const users = await getChurnedUsers();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">משתמשים שנטשו</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            חשבונות שנמחקו מהאפליקציה — {users.length} משתמשים
          </p>
        </div>
        <Link
          href="/vermillion/users"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← משתמשים פעילים
        </Link>
      </header>

      {users.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
          אין משתמשים שנטשו עדיין
        </div>
      ) : (
        <div className="max-w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]" dir="rtl">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-black/20 text-[var(--muted)]">
                <th className="px-3 py-3 text-right">משתמש</th>
                <th className="px-3 py-3 text-right">טלפון</th>
                <th className="px-3 py-3 text-right">מנוי</th>
                <th className="px-3 py-3 text-right">טיימר DNA</th>
                <th className="hidden md:table-cell px-3 py-3 text-right">Stamps</th>
                <th className="hidden md:table-cell px-3 py-3 text-right">Streak</th>
                <th className="hidden md:table-cell px-3 py-3 text-right">הצטרף</th>
                <th className="px-3 py-3 text-right">נמחק</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const c = u.commitment;
                const timer = formatTimer(c?.committed_hour, c?.committed_minute);

                return (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--border)]/40 opacity-60 hover:opacity-80"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-[var(--muted)] line-through">
                        {u.name || u.email || u.id.slice(0, 12)}
                      </div>
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
                    <td className="hidden md:table-cell px-3 py-2 text-[var(--muted)]">
                      {c?.streak_days ?? 0}
                    </td>
                    <td className="hidden md:table-cell px-3 py-2 text-xs text-[var(--muted)]">
                      {u.joined_at
                        ? new Date(u.joined_at).toLocaleDateString("he-IL")
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-red-400">
                      {new Date(u.deletedAt).toLocaleDateString("he-IL")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
