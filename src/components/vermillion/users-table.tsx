import Link from "next/link";
import { getVermillionUsers, formatTimer } from "@/lib/vermillion/queries";
import { IngestionGate } from "./ingestion-gate";

export async function VermillionUsersTable() {
  const users = await getVermillionUsers();

  return (
    <IngestionGate>
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-black/20 text-[var(--muted)]">
              <th className="px-3 py-3 text-right">משתמש</th>
              <th className="px-3 py-3 text-right">טלפון</th>
              <th className="px-3 py-3 text-right">מנוי</th>
              <th className="px-3 py-3 text-right">טיימר DNA</th>
              <th className="px-3 py-3 text-right">שישי/שבת</th>
              <th className="px-3 py-3 text-right">Streak</th>
              <th className="px-3 py-3 text-right">Stamps</th>
              <th className="px-3 py-3 text-right">ניקוד</th>
              <th className="px-3 py-3 text-right">אונבורדינג</th>
              <th className="px-3 py-3 text-right">צ׳אט AI</th>
              <th className="px-3 py-3 text-right">הצטרף</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const c = u.commitment;
              const weekend =
                c?.friday_target_hour != null
                  ? `ו׳ ${formatTimer(c.friday_target_hour, c.friday_target_minute)} · ש׳ ${formatTimer(c.saturday_target_hour, c.saturday_target_minute)}`
                  : "—";

              return (
                <tr
                  key={u.id}
                  className="border-b border-[var(--border)]/40 hover:bg-white/5"
                >
                  <td className="px-3 py-2">
                    <Link
                      href={`/vermillion/users/${u.id}`}
                      className="font-medium text-[var(--accent)] hover:underline"
                    >
                      {u.name || `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || "—"}
                    </Link>
                    <p className="text-xs text-[var(--muted)]">{u.email}</p>
                  </td>
                  <td className="px-3 py-2">{u.phone ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        u.subscription === "premium"
                          ? "text-amber-300"
                          : "text-[var(--muted)]"
                      }
                    >
                      {u.subscription}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono">{u.timerDisplay ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{weekend}</td>
                  <td className="px-3 py-2">{c?.streak_days ?? 0}</td>
                  <td className="px-3 py-2">{u.stampsThisMonth}</td>
                  <td className="px-3 py-2">{u.totalScoreThisMonth}</td>
                  <td className="px-3 py-2">
                    {u.onboardingDays}/7
                    {u.onboarding_complete ? " ✓" : ""}
                  </td>
                  <td className="px-3 py-2">{u.chatMessageCount}</td>
                  <td className="px-3 py-2 text-xs text-[var(--muted)]">
                    {new Date(u.joined_at).toLocaleDateString("he-IL")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-6 text-center text-sm text-[var(--muted)]">
            אין משתמשים במאגר המקומי — הפעל סנכרון
          </p>
        )}
      </div>
    </IngestionGate>
  );
}
