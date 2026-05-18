import Link from "next/link";
import { ActivityLog } from "@/components/ceo/activity-log";

export const dynamic = "force-dynamic";

export default function CeoActivityPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">יומן פעילות</h1>
          <p className="text-sm text-[var(--muted)]">מי עשה מה ב-CRM</p>
        </div>
        <Link href="/ceo" className="text-sm text-[var(--accent)] hover:underline">
          ← מנכ״ל
        </Link>
      </header>
      <ActivityLog />
    </div>
  );
}
