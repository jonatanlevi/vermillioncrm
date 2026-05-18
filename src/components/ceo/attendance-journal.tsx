import Link from "next/link";
import { PrismaEmployeeModelsMissingError } from "@/lib/ceo/db-access";
import {
  getAttendanceJournal,
  getRecentAttendance,
  shiftWorkDate,
  workDateKey,
} from "@/lib/ceo/attendance";
import { PrismaSetupBanner } from "./prisma-setup-banner";
import { attendanceLabel, roleLabel } from "@/lib/ceo/constants";
import { AttendanceMarkForm, type AttendanceFormInitial } from "./attendance-mark-form";
import { AttendanceRowEdit } from "./attendance-row-edit";
import { AttendanceQuickActions } from "./attendance-quick-actions";

function formatTime(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function statusClass(status: string) {
  switch (status) {
    case "PRESENT":
      return "text-green-400";
    case "LATE":
      return "text-amber-300";
    case "ABSENT":
    case "SICK":
      return "text-red-400";
    case "REMOTE":
      return "text-sky-300";
    case "VACATION":
      return "text-purple-300";
    default:
      return "text-[var(--muted)]";
  }
}

function toTimeStr(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export async function AttendanceJournal({
  workDate,
  editEmployeeId,
}: {
  workDate?: string;
  editEmployeeId?: string;
}) {
  const date = workDate && /^\d{4}-\d{2}-\d{2}$/.test(workDate) ? workDate : workDateKey();

  let journal;
  let recent;
  try {
    journal = await getAttendanceJournal(date);
    recent = await getRecentAttendance(20);
  } catch (e) {
    if (e instanceof PrismaEmployeeModelsMissingError) {
      return <PrismaSetupBanner />;
    }
    throw e;
  }

  const employees = journal.rows.map((r) => ({ id: r.employeeId, name: r.name }));

  const editRow = editEmployeeId
    ? journal.rows.find((r) => r.employeeId === editEmployeeId)
    : undefined;

  const formInitial: AttendanceFormInitial | null = editRow
    ? {
        employeeId: editRow.employeeId,
        status: editRow.record?.status ?? "PRESENT",
        clockIn: toTimeStr(editRow.record?.clockIn ?? null) || "09:00",
        clockOut: toTimeStr(editRow.record?.clockOut ?? null) || "18:00",
        notes: editRow.record?.notes ?? "",
      }
    : null;
  const prev = shiftWorkDate(date, -1);
  const next = shiftWorkDate(date, 1);
  const today = workDateKey();
  const isToday = date === today;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">יומן נוכחות</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            רישום יומי לצוות — לא קשור למנויי האפליקציה
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ceo/team/new"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
          >
            + עובד חדש
          </Link>
          <Link href="/ceo" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm hover:bg-white/5">
            ← מנכ״ל
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/ceo/attendance?date=${prev}`}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-white/5"
        >
          ← יום קודם
        </Link>
        <span className="rounded-lg bg-[var(--accent-dim)]/30 px-4 py-2 text-sm font-medium">
          {new Date(date + "T12:00:00").toLocaleDateString("he-IL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {isToday && " (היום)"}
        </span>
        <Link
          href={`/ceo/attendance?date=${next}`}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-white/5"
        >
          יום הבא →
        </Link>
        {!isToday && (
          <Link
            href="/ceo/attendance"
            className="rounded-lg border border-[var(--accent)]/50 px-3 py-2 text-sm text-[var(--accent)]"
          >
            חזרה להיום
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <SummaryPill label="נוכחים" value={journal.summary.PRESENT + journal.summary.LATE} />
        <SummaryPill label="מהבית" value={journal.summary.REMOTE} />
        <SummaryPill label="נעדרים" value={journal.summary.ABSENT} />
        <SummaryPill label="מחלה/חופש" value={journal.summary.SICK + journal.summary.VACATION} />
        <SummaryPill label="לא סומן" value={journal.summary.unmarked} warn />
      </div>

      <AttendanceMarkForm employees={employees} workDate={date} initial={formInitial} />

      <section className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <h2 className="border-b border-[var(--border)] px-4 py-3 font-semibold">
          נוכחות ליום {date}
        </h2>
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="text-[var(--muted)]">
              <th className="px-3 py-2 text-right">עובד</th>
              <th className="px-3 py-2 text-right">תפקיד</th>
              <th className="px-3 py-2 text-right">סטטוס</th>
              <th className="px-3 py-2 text-right">עריכה ידנית (כניסה / יציאה)</th>
              <th className="px-3 py-2 text-right">שעות</th>
              <th className="px-3 py-2 text-right">מהיר</th>
            </tr>
          </thead>
          <tbody>
            {journal.rows.map((row) => (
              <tr key={row.employeeId} className="border-t border-[var(--border)]/40">
                <td className="px-3 py-2">
                  <Link
                    href={`/ceo/team/${row.employeeId}`}
                    className="font-medium text-[var(--accent)] hover:underline"
                  >
                    {row.name}
                  </Link>
                  {row.department && (
                    <p className="text-xs text-[var(--muted)]">{row.department}</p>
                  )}
                </td>
                <td className="px-3 py-2">{roleLabel(row.role)}</td>
                <td className={`px-3 py-2 font-medium ${row.record ? statusClass(row.record.status) : "text-[var(--muted)]"}`}>
                  {row.record ? attendanceLabel(row.record.status) : "לא סומן"}
                  <Link
                    href={`/ceo/attendance?date=${date}&edit=${row.employeeId}#attendance-form`}
                    className="mr-2 text-xs text-[var(--accent)] hover:underline"
                  >
                    למעלה ↑
                  </Link>
                </td>
                <td className="px-3 py-2" colSpan={1}>
                  <AttendanceRowEdit
                    employeeId={row.employeeId}
                    workDate={date}
                    initialStatus={row.record?.status ?? "PRESENT"}
                    initialClockIn={row.record?.clockIn?.toISOString() ?? null}
                    initialClockOut={row.record?.clockOut?.toISOString() ?? null}
                    initialNotes={row.record?.notes ?? null}
                  />
                </td>
                <td className="px-3 py-2 font-mono">
                  {row.record?.hoursWorked != null ? row.record.hoursWorked : "—"}
                </td>
                <td className="px-3 py-2">
                  <AttendanceQuickActions
                    employeeId={row.employeeId}
                    workDate={date}
                    hasClockIn={Boolean(row.record?.clockIn)}
                    hasClockOut={Boolean(row.record?.clockOut)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-3 font-semibold">רישומים אחרונים</h2>
        <ul className="space-y-2 text-sm">
          {recent.map((r) => (
            <li key={r.id} className="flex flex-wrap justify-between gap-2">
              <span>
                <strong>{r.employee.name}</strong> · {r.workDate} ·{" "}
                <span className={statusClass(r.status)}>{attendanceLabel(r.status)}</span>
                {r.clockIn && (
                  <span className="text-[var(--muted)]">
                    {" "}
                    · {formatTime(r.clockIn)}–{formatTime(r.clockOut)}
                  </span>
                )}
              </span>
              {r.notes && <span className="text-xs text-[var(--muted)]">{r.notes}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SummaryPill({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 ${
        warn && value > 0
          ? "border-amber-600/50 text-amber-200"
          : "border-[var(--border)]"
      }`}
    >
      {label}: <strong>{value}</strong>
    </span>
  );
}
