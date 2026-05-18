import Link from "next/link";
import { TeamTable } from "@/components/ceo/team-table";

export const dynamic = "force-dynamic";

export default function CeoTeamPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">צוות</h1>
          <p className="text-sm text-[var(--muted)]">כל העובדים הפנימיים</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/ceo/team/new"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
          >
            + עובד חדש
          </Link>
          <Link
            href="/ceo"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-white/5"
          >
            ← מנכ״ל
          </Link>
        </div>
      </header>
      <TeamTable />
    </div>
  );
}
