"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  ingestionConfigured: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string;
  lastSyncError: string | null;
  userCount: number;
};

export function AppSyncPanel({
  ingestionConfigured,
  lastSyncAt,
  lastSyncStatus,
  lastSyncError,
  userCount,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runSync() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/app/sync", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setMessage(data.error ?? "סנכרון נכשל");
      } else {
        setMessage(`סונכרנו ${data.userCount} משתמשים`);
        router.refresh();
      }
    } catch {
      setMessage("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  const lastLabel = lastSyncAt
    ? new Date(lastSyncAt).toLocaleString("he-IL")
    : "מעולם לא";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm">
      <p className="font-semibold">יניקת נתונים מאפליקציית VerMillion</p>
      <p className="mt-2 rounded-lg border border-[var(--border)]/60 bg-black/20 px-3 py-2 text-xs text-[var(--muted)]">
        <strong className="text-white">כל כמה זמן?</strong> שינוי ב-Supabase → עד כמה שניות (Realtime).
        בעמוד מוצר בלבד: בדיקה כל ~30 שנ׳, רענון מסך רק אם הנתונים השתנו.
        סנכרון מלא — בלחיצה על הכפתור למטה.
      </p>
      <p className="mt-1 text-[var(--muted)]">
        כיוון הסנכרון: <strong className="text-white">מ-Supabase → CRM</strong> (לא הפוך).
        מחיקה באפליקציה → נעלם מ-Auth ב-Supabase → ה-CRM מסמן «נטש» (אוטומטית או אחרי «סנכרן עכשיו»).
        מחיקת מנכ״ל מה-CRM שולחת מחיקה ל-Supabase ושומרת ארכיון מקומי.
      </p>
      <p className="mt-2 text-xs text-green-400/90">
        האזנה לשינויים: פעילה כשהשרת רץ (ברירת מחדל). לכיבוי:{" "}
        <code className="text-green-200">VERMILLION_REALTIME_SYNC=false</code>
      </p>

      <dl className="mt-3 grid gap-1 text-xs text-[var(--muted)] sm:grid-cols-2">
        <div>
          <dt>מקור יניקה</dt>
          <dd className="text-white">{ingestionConfigured ? "מוגדר" : "לא מוגדר"}</dd>
        </div>
        <div>
          <dt>סנכרון אחרון</dt>
          <dd className="text-white">{lastLabel}</dd>
        </div>
        <div>
          <dt>סטטוס</dt>
          <dd className="text-white">{lastSyncStatus}</dd>
        </div>
        <div>
          <dt>במאגר המקומי</dt>
          <dd className="text-white">{userCount}</dd>
        </div>
      </dl>

      {lastSyncError && (
        <p className="mt-2 text-xs text-red-400">{lastSyncError}</p>
      )}
      {message && (
        <p className="mt-2 text-xs text-amber-200">{message}</p>
      )}

      <button
        type="button"
        onClick={() => void runSync()}
        disabled={!ingestionConfigured || loading}
        aria-busy={loading}
        className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {loading ? "מייבא נתונים…" : "סנכרן עכשיו מאפליקציה"}
      </button>
    </div>
  );
}
