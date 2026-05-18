"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ATTENDANCE_STATUS } from "@/lib/ceo/constants";

type EmployeeOption = { id: string; name: string };

export type AttendanceFormInitial = {
  employeeId: string;
  status: string;
  clockIn: string;
  clockOut: string;
  notes: string;
};

type Props = {
  employees: EmployeeOption[];
  workDate: string;
  initial?: AttendanceFormInitial | null;
};

function toTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function AttendanceMarkForm({ employees, workDate, initial }: Props) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(initial?.employeeId ?? employees[0]?.id ?? "");
  const [status, setStatus] = useState(initial?.status ?? "PRESENT");
  const [clockIn, setClockIn] = useState(initial?.clockIn ?? "09:00");
  const [clockOut, setClockOut] = useState(initial?.clockOut ?? "18:00");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    setEmployeeId(initial.employeeId);
    setStatus(initial.status);
    setClockIn(initial.clockIn || "09:00");
    setClockOut(initial.clockOut || "18:00");
    setNotes(initial.notes);
  }, [initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) return;
    setLoading(true);
    setMessage(null);

    const clockInIso = clockIn
      ? new Date(`${workDate}T${clockIn}:00`).toISOString()
      : null;
    const clockOutIso = clockOut
      ? new Date(`${workDate}T${clockOut}:00`).toISOString()
      : null;

    try {
      const res = await fetch("/api/ceo/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          workDate,
          status,
          clockIn: clockInIso,
          clockOut: clockOutIso,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMessage(data.error ?? "שגיאה");
      } else {
        setMessage("נשמר");
        router.refresh();
      }
    } catch {
      setMessage("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  async function quickAction(action: "clock_in" | "clock_out") {
    if (!employeeId) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ceo/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, employeeId, workDate }),
      });
      const data = await res.json();
      if (!data.ok) setMessage(data.error ?? "שגיאה");
      else {
        setMessage(action === "clock_in" ? "כניסה נרשמה" : "יציאה נרשמה");
        router.refresh();
      }
    } catch {
      setMessage("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      id="attendance-form"
      onSubmit={submit}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3"
    >
      <p className="font-semibold text-sm">רישום / עדכון נוכחות ידני</p>
      <p className="text-xs text-[var(--muted)]">
        ערוך כאן או ישירות בשורות הטבלה למטה
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs text-[var(--muted)]">
          עובד
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-2 py-2 text-sm text-white"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-[var(--muted)]">
          סטטוס
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-2 py-2 text-sm text-white"
          >
            {Object.entries(ATTENDANCE_STATUS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs text-[var(--muted)]">
          כניסה
          <input
            type="time"
            value={clockIn}
            onChange={(e) => setClockIn(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-2 py-2 text-sm text-white"
          />
        </label>

        <label className="block text-xs text-[var(--muted)]">
          יציאה
          <input
            type="time"
            value={clockOut}
            onChange={(e) => setClockOut(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-2 py-2 text-sm text-white"
          />
        </label>
      </div>

      <label className="block text-xs text-[var(--muted)]">
        הערה
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="אופציונלי"
          className="mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-2 py-2 text-sm text-white"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => quickAction("clock_in")}
          disabled={loading}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
        >
          כניסה עכשיו
        </button>
        <button
          type="button"
          onClick={() => quickAction("clock_out")}
          disabled={loading}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
        >
          יציאה עכשיו
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "שומר…" : "שמור"}
        </button>
      </div>

      {message && <p className="text-xs text-amber-200">{message}</p>}
    </form>
  );
}
