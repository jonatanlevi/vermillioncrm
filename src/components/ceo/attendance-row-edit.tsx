"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ATTENDANCE_STATUS } from "@/lib/ceo/constants";

function toTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type Props = {
  employeeId: string;
  workDate: string;
  initialStatus: string;
  initialClockIn: string | null;
  initialClockOut: string | null;
  initialNotes: string | null;
};

export function AttendanceRowEdit({
  employeeId,
  workDate,
  initialStatus,
  initialClockIn,
  initialClockOut,
  initialNotes,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus || "PRESENT");
  const [clockIn, setClockIn] = useState(toTimeInput(initialClockIn));
  const [clockOut, setClockOut] = useState(toTimeInput(initialClockOut));
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const clockInIso = clockIn
        ? new Date(`${workDate}T${clockIn}:00`).toISOString()
        : null;
      const clockOutIso = clockOut
        ? new Date(`${workDate}T${clockOut}:00`).toISOString()
        : null;

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
      if (data.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
      >
        {Object.entries(ATTENDANCE_STATUS).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex gap-1">
        <input
          type="time"
          value={clockIn}
          onChange={(e) => setClockIn(e.target.value)}
          title="כניסה"
          className="w-full rounded border border-[var(--border)] bg-black/30 px-1 py-1 text-xs font-mono text-white"
        />
        <input
          type="time"
          value={clockOut}
          onChange={(e) => setClockOut(e.target.value)}
          title="יציאה"
          className="w-full rounded border border-[var(--border)] bg-black/30 px-1 py-1 text-xs font-mono text-white"
        />
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="הערה"
        className="rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
      />
      <button
        type="button"
        onClick={save}
        disabled={loading}
        className="rounded bg-[var(--accent)] px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        {loading ? "…" : "שמור"}
      </button>
    </div>
  );
}
