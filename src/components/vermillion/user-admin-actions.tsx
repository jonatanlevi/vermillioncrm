"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  userId: string;
  email: string | null;
  name: string | null;
};

export function UserAdminActions({ userId, email, name }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"refresh" | "delete" | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

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

  async function remove() {
    if (!email) {
      setMessage("אין אימייל לאישור — פנה למפתח");
      return;
    }
    if (confirmEmail !== email) {
      setMessage("הקלד את האימייל המדויק לאישור מחיקה");
      return;
    }
    if (
      !window.confirm(
        `למחוק לצמיתות את ${name || email} מהאפליקציה (Supabase) ומה-CRM?\nפעולה בלתי הפיכה.`
      )
    ) {
      return;
    }

    setLoading("delete");
    setMessage(null);
    try {
      const res = await fetch(`/api/app/users/${userId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "מחיקה נכשלה");
      router.push("/vermillion/users");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "שגיאה");
      setLoading(null);
    }
  }

  return (
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

      <div className="mt-6 rounded-lg border border-red-900/40 bg-red-950/20 p-4">
        <p className="text-sm font-medium text-red-200">מחיקה לצמיתות</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          יימחק מ-Supabase (חשבון + פרופיל + נתונים) ומה-CRM. הקלד לאישור:{" "}
          <span className="font-mono text-red-100">{email ?? "—"}</span>
        </p>
        <input
          type="email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder="אימייל לאישור"
          dir="ltr"
          className="mt-3 w-full max-w-md rounded-lg border border-red-900/50 bg-black/30 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={remove}
          disabled={loading !== null || !email}
          className="mt-3 rounded-lg bg-red-800 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading === "delete" ? "מוחק…" : "מחק משתמש מהאפליקציה"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-amber-200">{message}</p>}
    </section>
  );
}
