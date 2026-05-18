"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  userId: string;
  email: string | null;
  name: string | null;
  isCeo: boolean;
  isRemoved: boolean;
};

export function UserAdminActions({ userId, email, name, isCeo, isRemoved }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"refresh" | "delete" | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const displayName = name || email || userId.slice(0, 12);

  async function refresh() {
    setLoading("refresh");
    setMessage(null);
    try {
      const res = await fetch(`/api/app/users/${userId}/refresh`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "רענון נכשל");
      setMessage("הנתונים עודכנו מהאפליקציה");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "שגיאה");
    } finally {
      setLoading(null);
    }
  }

  async function confirmDelete() {
    setLoading("delete");
    setMessage(null);
    try {
      const res = await fetch(`/api/app/users/${userId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "מחיקה נכשלה");
      setShowDeleteConfirm(false);
      router.push("/vermillion/churned");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "שגיאה");
      setLoading(null);
    }
  }

  return (
    <>
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-1 font-semibold">ניהול משתמש</h2>
        <p className="mb-4 text-xs text-[var(--muted)]">
          פעולות משפיעות על Supabase (אפליקציית VerMillion) — לא רק על העותק המקומי.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={loading !== null}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            {loading === "refresh" ? "מרענן…" : "רענן מהאפליקציה"}
          </button>
        </div>

        {!isCeo && !isRemoved && (
          <p className="mt-4 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
            מחיקת משתמשים מהאפליקציה זמינה למנכ״ל בלבד. אם אתה מנכ״ל — התנתק והתחבר מחדש, או ודא
            שבסרגל למעלה מופיע «מחובר כמנכ״ל».
          </p>
        )}

        {isCeo && !isRemoved && (
          <div className="mt-6 rounded-lg border border-red-900/40 bg-red-950/20 p-4">
            <p className="text-sm font-medium text-red-200">מחיקה לצמיתות (מנכ״ל בלבד)</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              יימחק מ-Supabase (חשבון ונתונים). העותק ב-CRM יועבר ל«נמחקו על ידי מנכ״ל».
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading !== null}
              className="mt-3 rounded-lg bg-red-800 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              מחק משתמש מהאפליקציה…
            </button>
          </div>
        )}

        {message && <p className="mt-3 text-sm text-amber-200">{message}</p>}
      </section>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          displayName={displayName}
          email={email}
          userId={userId}
          loading={loading === "delete"}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}

function DeleteConfirmModal({
  displayName,
  email,
  userId,
  loading,
  onCancel,
  onConfirm,
}: {
  displayName: string;
  email: string | null;
  userId: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-red-900/50 bg-[var(--surface)] p-6 shadow-xl"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="delete-title" className="text-lg font-bold text-red-200">
          אישור מחיקה לצמיתות
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          האם למחוק את המשתמש הבא? לא ניתן לשחזר.
        </p>

        <dl className="mt-4 space-y-2 rounded-lg border border-[var(--border)] bg-black/20 p-4 text-sm">
          <div>
            <dt className="text-xs text-[var(--muted)]">שם</dt>
            <dd className="font-medium">{displayName}</dd>
          </div>
          {email && (
            <div>
              <dt className="text-xs text-[var(--muted)]">אימייל</dt>
              <dd className="font-mono text-xs" dir="ltr">
                {email}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-[var(--muted)]">מזהה</dt>
            <dd className="break-all font-mono text-xs text-[var(--muted)]" dir="ltr">
              {userId}
            </dd>
          </div>
        </dl>

        <ul className="mt-4 list-inside list-disc space-y-1 text-xs text-red-200/90">
          <li>מחיקה מ-Supabase (Auth + כל הנתונים)</li>
          <li>שמירת עותק ב-CRM תחת «נמחקו על ידי מנכ״ל»</li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "מוחק…" : "כן, מחק לצמיתות"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
