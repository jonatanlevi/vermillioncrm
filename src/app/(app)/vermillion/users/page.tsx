import Link from "next/link";
import { VermillionUsersTable } from "@/components/vermillion/users-table";

export const dynamic = "force-dynamic";

export default function VermillionUsersPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">משתמשי VerMillion</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            פרופיל, טיימר DNA, Stamps, אונבורדינג וצ׳אט AI
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/vermillion/churned"
            className="text-sm text-[var(--muted)] hover:text-[var(--accent)] hover:underline"
          >
            לא פעילים (נטשו / נמחקו) →
          </Link>
          <Link
            href="/vermillion"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            ← דשבורד
          </Link>
        </div>
      </header>
      <VermillionUsersTable />
    </div>
  );
}
