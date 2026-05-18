"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AttendanceQuickActions({
  employeeId,
  workDate,
  hasClockIn,
  hasClockOut,
}: {
  employeeId: string;
  workDate: string;
  hasClockIn: boolean;
  hasClockOut: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run(action: "clock_in" | "clock_out") {
    setLoading(true);
    try {
      await fetch("/api/ceo/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, employeeId, workDate }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-1">
      <button
        type="button"
        disabled={loading || hasClockIn}
        onClick={() => run("clock_in")}
        className="rounded px-2 py-1 text-xs border border-[var(--border)] hover:bg-white/5 disabled:opacity-40"
        title="כניסה"
      >
        כניסה
      </button>
      <button
        type="button"
        disabled={loading || !hasClockIn || hasClockOut}
        onClick={() => run("clock_out")}
        className="rounded px-2 py-1 text-xs border border-[var(--border)] hover:bg-white/5 disabled:opacity-40"
        title="יציאה"
      >
        יציאה
      </button>
    </div>
  );
}
