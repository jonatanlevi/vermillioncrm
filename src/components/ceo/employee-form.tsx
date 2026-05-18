"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EMPLOYEE_ROLES, EMPLOYEE_STATUS } from "@/lib/ceo/constants";

type ManagerOption = { id: string; name: string };

type Props = {
  managers: ManagerOption[];
};

export function EmployeeForm({ managers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("SALES");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [hiredAt, setHiredAt] = useState("");
  const [managerId, setManagerId] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ceo/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          role,
          department: department || null,
          phone: phone || null,
          status,
          hiredAt: hiredAt || null,
          managerId: managerId || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "שגיאה");
        return;
      }
      router.push(`/ceo/team/${data.employee.id}`);
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
    <form
      onSubmit={submit}
      className="max-w-2xl space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <p className="text-sm text-[var(--muted)]">כל השדות מסומנים ב-* הם חובה</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs text-[var(--muted)]">
          שם מלא *
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-xs text-[var(--muted)]">
          אימייל *
          <input
            required
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-xs text-[var(--muted)]">
          תפקיד *
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
          >
            {Object.entries(EMPLOYEE_ROLES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-[var(--muted)]">
          מחלקה
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="מכירות, שיווק…"
            className={inputClass}
          />
        </label>
        <label className="block text-xs text-[var(--muted)]">
          טלפון
          <input
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-xs text-[var(--muted)]">
          סטטוס
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {Object.entries(EMPLOYEE_STATUS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-[var(--muted)]">
          תאריך תחילת עבודה
          <input
            type="date"
            value={hiredAt}
            onChange={(e) => setHiredAt(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-xs text-[var(--muted)]">
          מנהל ישיר
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className={inputClass}
          >
            <option value="">ללא</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "שומר…" : "צור עובד"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-white/5"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
