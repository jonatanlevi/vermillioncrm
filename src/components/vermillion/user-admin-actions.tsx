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

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; text: string }
  | { kind: "error"; text: string };

export function UserAdminActions({ userId, email, name, isCeo, isRemoved }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"refresh" | "delete" | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const displayName = name || email || userId.slice(0, 12);

  async function refresh() {
    setLoading("refresh");
    setStatus({ kind: "loading" });

    try {
      const res = await fetch(`/api/app/users/${encodeURIComponent(userId)}/refresh`, {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      let data: { ok?: boolean; error?: string } = {};
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text) as { ok?: boolean; error?: string };
        } catch {
          throw new Error(`תשובה לא תקינה מהשרת (${res.status})`);
        }
      }

      if (!res.ok) {
        throw new Error(data.error ?? `שגיאת שרת ${res.status}`);
      }
      if (!data.ok) {
        throw new Error(data.error ?? "רענון נכשל");
      }

      setStatus({ kind: "success", text: "הנתונים עודכנו מהאפליקציה — מרענן את המסך…" });
      router.refresh();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "שגיאת רשת — ודא שהשרת רץ (npm run dev, פורט 3001)";
      setStatus({ kind: "error", text: msg });
    } finally {
      setLoading(null);
    }
  }

  async function confirmDelete() {
    setLoading("delete");
    setStatus({ kind: "idle" });
    try {
      const res = await fetch(`/api/app/users/${encodeURIComponent(userId)}/delete`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "מחיקה נכשלה");
      setShowDeleteConfirm(false);
      router.push("/vermillion/churned");
      router.refresh();
    } catch (e) {
      setStatus({
        kind: "error",
        text: e instanceof Error ? e.message : "שגיאה",
      });
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

        <RefreshStatusBanner status={status} />

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading !== null}
          aria-busy={loading === "refresh"}
          className="rounded-lg border border-[var(--accent)] bg-[var(--accent)]/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent)]/30 disabled:opacity-50"
        >
          {loading === "refresh" ? "מרענן…" : "רענן מהאפליקציה"}
        </button>

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
              {loading === "delete" ? "מוחק…" : "מחק משתמש מהאפליקציה…"}
            </button>
          </div>
        )}
      </section>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          displayName={displayName}
          email={email}
          userId={userId}
          loading={loading === "delete"}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </>
  );
}

function RefreshStatusBanner({ status }: { status: Status }) {
  if (status.kind === "idle") return null;

  if (status.kind === "loading") {
    return (
      <p
        role="status"
        aria-live="polite"
        className="mb-4 rounded-lg border border-sky-800/50 bg-sky-950/30 px-3 py-2 text-sm text-sky-200"
      >
        מושך נתונים מ-Supabase… (עשוי לקחת כמה שניות)
      </p>
    );
  }

  if (status.kind === "success") {
    return (
      <p
        role="status"
        aria-live="polite"
        className="mb-4 rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200"
      >
        {status.text}
      </p>
    );
  }

  return (
    <p
      role="alert"
      className="mb-4 rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-200"
    >
      {status.text}
    </p>
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
        <p className="mt-2 text-sm text-[var(--muted)]">האם למחוק את המשתמש הבא? לא ניתן לשחזר.</p>

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
