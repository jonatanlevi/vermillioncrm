"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  parsePermissions,
  type PermissionKey,
} from "@/lib/auth/permissions";
import { roleLabel } from "@/lib/ceo/constants";
import type { PendingSignupRow } from "@/lib/ceo/signup-approvals";

type Props = {
  pending: PendingSignupRow[];
};

export function PendingApprovals({ pending: initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<Record<string, Record<PermissionKey, boolean>>>(
    () =>
      Object.fromEntries(
        initial.map((p) => [p.id, { ...parsePermissions(p.permissions) }])
      )
  );

  async function act(id: string, action: "approve" | "reject") {
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/ceo/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          permissions: action === "approve" ? editPerms[id] : undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "שגיאה");
        return;
      }
      setItems((list) => list.filter((x) => x.id !== id));
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoadingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
        אין בקשות הרשמה ממתינות
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {items.map((p) => {
        const perms = editPerms[p.id] ?? parsePermissions(p.permissions);
        return (
          <article
            key={p.id}
            className="rounded-xl border border-amber-700/40 bg-amber-950/15 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="mt-1 font-mono text-sm text-[var(--muted)]" dir="ltr">
                  @{p.username}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  נרשם: {new Date(p.createdAt).toLocaleString("he-IL")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={loadingId === p.id}
                  onClick={() => act(p.id, "approve")}
                  className="rounded-lg bg-green-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  אשר
                </button>
                <button
                  type="button"
                  disabled={loadingId === p.id}
                  onClick={() => act(p.id, "reject")}
                  className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                >
                  דחה
                </button>
              </div>
            </div>

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-[var(--muted)]">תפקיד בעסק</dt>
                <dd>{roleLabel(p.role)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--muted)]">מחלקה</dt>
                <dd>{p.department ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--muted)]">טלפון</dt>
                <dd dir="ltr">{p.phone ?? "—"}</dd>
              </div>
            </dl>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-[var(--muted)]">
                הרשאות לאישור (ניתן לשנות לפני אישור)
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PERMISSION_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={perms[key]}
                      onChange={() =>
                        setEditPerms((prev) => ({
                          ...prev,
                          [p.id]: { ...perms, [key]: !perms[key] },
                        }))
                      }
                      className="rounded border-[var(--border)]"
                    />
                    {PERMISSION_LABELS[key]}
                  </label>
                ))}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
