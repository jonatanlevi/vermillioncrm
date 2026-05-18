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
        <Link
          href="/vermillion"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← דשבורד
        </Link>
      </header>
      <VermillionUsersTable />
    </div>
  );
}
