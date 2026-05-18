"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  parsePermissions,
  type PermissionKey,
} from "@/lib/auth/permissions";
import type { CrmEmployeeRow } from "@/lib/ceo/employees-auth";
import { EMPLOYEE_ROLES } from "@/lib/ceo/constants";
import Link from "next/link";
import { PasswordField } from "@/components/auth/password-field";

type Props = {
  employees: CrmEmployeeRow[];
};

const emptyPerms = () =>
  Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false])) as Record<
    PermissionKey,
    boolean
  >;

export function EmployeesAdmin({ employees: initial }: Props) {
  const router = useRouter();
  const [employees] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [jobRole, setJobRole] = useState("SALES");
  const [perms, setPerms] = useState(emptyPerms);

  const passwordsMatch =
    password.length >= 8 &&
    passwordConfirm.length >= 8 &&
    password === passwordConfirm;

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ceo/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          password,
          jobRole,
          permissions: perms,
          crmAccess: true,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "שגיאה");
        return;
      }
      setName("");
      setUsername("");
      setPassword("");
      setPasswordConfirm("");
      setJobRole("SALES");
      setPerms(emptyPerms());
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  async function saveEdit(id: string, permissions: Record<PermissionKey, boolean>, newPassword: string) {
    setLoading(true);
    setError(null);
    const body: Record<string, unknown> = { permissions };
    if (newPassword) body.password = newPassword;

    try {
      const res = await fetch(`/api/ceo/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "שגיאה");
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(id: string) {
    if (!confirm("להשבית את העובד? לא יוכל להתחבר.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ceo/employees/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "שגיאה");
        return;
      }
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-sm text-white";

  return (
    <div className="space-y-8" dir="rtl">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">הוסף עובד — כניסה מיידית</h2>
          <Link
            href="/register?mode=employee"
            className="text-xs text-[var(--accent)] hover:underline"
          >
            טופס מורחב →
          </Link>
        </div>
        <p className="mb-4 text-xs text-[var(--muted)]">
          עובד שנרשם בעצמו ב-/register ממתין לאישור ב«אישור הרשמות». כאן — נכנס מיד ללא המתנה.
        </p>
        <form onSubmit={createEmployee} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs text-[var(--muted)]">
              שם *
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-xs text-[var(--muted)]">
              שם משתמש *
              <input
                required
                type="text"
                dir="ltr"
                autoComplete="off"
                pattern="[a-zA-Z0-9._-]{3,32}"
                title="3–32 תווים: אותיות, מספרים, נקודה, מקף, קו תחתון"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
              />
            </label>
            <PasswordField
              label="סיסמה *"
              value={password}
              onChange={setPassword}
            />
            <PasswordField
              label="אימות סיסמה *"
              value={passwordConfirm}
              onChange={setPasswordConfirm}
              matchWith={password}
            />
            <label className="block text-xs text-[var(--muted)] sm:col-span-2">
              תפקיד בעסק *
              <select
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className={inputClass}
              >
                {Object.entries(EMPLOYEE_ROLES)
                  .filter(([k]) => k !== "CEO")
                  .map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
          </div>

          <PermissionGrid values={perms} onChange={setPerms} />

          <button
            type="submit"
            disabled={loading || !passwordsMatch}
            className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm text-white disabled:opacity-50"
          >
            הוסף עובד
          </button>
        </form>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <section className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--muted)]">
              <th className="px-3 py-3 text-right">שם</th>
              <th className="px-3 py-3 text-right">שם משתמש</th>
              <th className="px-3 py-3 text-right">סטטוס</th>
              <th className="px-3 py-3 text-right">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[var(--muted)]">
                  אין עובדים עם גישת CRM
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <EmployeeRow
                  key={emp.id}
                  emp={emp}
                  editing={editingId === emp.id}
                  loading={loading}
                  onEdit={() => setEditingId(editingId === emp.id ? null : emp.id)}
                  onSave={(p, pw) => saveEdit(emp.id, p, pw)}
                  onDeactivate={() => deactivate(emp.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function PermissionGrid({
  values,
  onChange,
}: {
  values: Record<PermissionKey, boolean>;
  onChange: (v: Record<PermissionKey, boolean>) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <p className="text-xs font-medium text-[var(--muted)] sm:col-span-2">הרשאות</p>
      {PERMISSION_KEYS.map((key) => (
        <label key={key} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values[key]}
            onChange={() => onChange({ ...values, [key]: !values[key] })}
            className="rounded border-[var(--border)]"
          />
          {PERMISSION_LABELS[key]}
        </label>
      ))}
    </div>
  );
}

function EmployeeRow({
  emp,
  editing,
  loading,
  onEdit,
  onSave,
  onDeactivate,
}: {
  emp: CrmEmployeeRow;
  editing: boolean;
  loading: boolean;
  onEdit: () => void;
  onSave: (p: Record<PermissionKey, boolean>, pw: string) => void;
  onDeactivate: () => void;
}) {
  const parsed = parsePermissions(emp.permissions);
  const [editPerms, setEditPerms] = useState(parsed);
  const [editPassword, setEditPassword] = useState("");

  const inputClass =
    "mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-sm text-white";

  return (
    <tr className="border-b border-[var(--border)]/40">
      <td className="px-3 py-2 font-medium">{emp.name}</td>
      <td className="px-3 py-2 font-mono text-xs" dir="ltr">
        {emp.username}
      </td>
      <td className="px-3 py-2">
        <span className={emp.isActive ? "text-green-400" : "text-[var(--muted)]"}>
          {emp.isActive ? "פעיל" : "מושבת"}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className="text-xs text-[var(--accent)] hover:underline">
            ערוך הרשאות
          </button>
          {emp.isActive && (
            <button type="button" onClick={onDeactivate} className="text-xs text-red-400 hover:underline">
              השבת
            </button>
          )}
        </div>
        {!editing && (
          <p className="mt-1 text-xs text-[var(--muted)]">
            {PERMISSION_KEYS.filter((k) => parsed[k])
              .map((k) => PERMISSION_LABELS[k].split(" ")[0])
              .join(" · ") || "ללא הרשאות"}
          </p>
        )}
        {editing && (
          <div className="mt-3 space-y-3 rounded-lg border border-[var(--border)] bg-black/20 p-3">
            <PermissionGrid values={editPerms} onChange={setEditPerms} />
            <PasswordField
              label="סיסמה חדשה (אופציונלי)"
              value={editPassword}
              onChange={setEditPassword}
              required={false}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => onSave(editPerms, editPassword)}
              className="rounded bg-[var(--accent)] px-3 py-1 text-xs text-white"
            >
              שמור
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
