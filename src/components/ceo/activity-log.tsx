import Link from "next/link";
import { getActivityLog } from "@/lib/ceo/queries";
import { actionLabel, roleLabel } from "@/lib/ceo/constants";

export async function ActivityLog() {
  const items = await getActivityLog();

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <ul className="divide-y divide-[var(--border)]/40">
        {items.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <span>
              <Link
                href={`/ceo/team/${a.employee.id}`}
                className="font-medium text-[var(--accent)] hover:underline"
              >
                {a.employee.name}
              </Link>
              <span className="text-[var(--muted)]"> ({roleLabel(a.employee.role)})</span>
              <span> — {actionLabel(a.action)}</span>
            </span>
            <time className="text-xs text-[var(--muted)]">
              {a.createdAt.toLocaleString("he-IL")}
            </time>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="p-6 text-center text-sm text-[var(--muted)]">אין פעילות</p>
      )}
    </div>
  );
}
