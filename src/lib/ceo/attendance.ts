import { getCeoDb } from "./db-access";
import { logEmployeeActivity } from "./activity";
import { ensureDemoTeam, seedDemoAttendanceRecords } from "./seed";

export function workDateKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function parseWorkDate(key: string): Date {
  const [y, m, day] = key.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function shiftWorkDate(key: string, days: number): string {
  const d = parseWorkDate(key);
  d.setDate(d.getDate() + days);
  return workDateKey(d);
}

export type AttendanceRow = {
  employeeId: string;
  name: string;
  department: string | null;
  role: string;
  record: {
    id: string;
    status: string;
    clockIn: Date | null;
    clockOut: Date | null;
    hoursWorked: number | null;
    notes: string | null;
  } | null;
};

export type AttendanceJournal = {
  workDate: string;
  summary: Record<string, number> & { total: number; unmarked: number };
  rows: AttendanceRow[];
};

export async function getAttendanceJournal(workDate: string): Promise<AttendanceJournal> {
  await ensureDemoTeam();
  await seedDemoAttendanceRecords();
  const db = getCeoDb();

  const employees = await db.employee.findMany({
    where: { status: { not: "INACTIVE" } },
    orderBy: { name: "asc" },
  });

  const records = await db.employeeAttendance.findMany({
    where: { workDate },
  });

  const byEmployee = new Map(records.map((r) => [r.employeeId, r]));

  const summary: AttendanceJournal["summary"] = {
    total: employees.length,
    unmarked: 0,
    PRESENT: 0,
    LATE: 0,
    REMOTE: 0,
    ABSENT: 0,
    SICK: 0,
    VACATION: 0,
    HALF_DAY: 0,
  };

  const rows: AttendanceRow[] = employees.map((e) => {
    const rec = byEmployee.get(e.id);
    if (!rec) {
      summary.unmarked += 1;
    } else {
      const key = rec.status as keyof typeof summary;
      if (typeof summary[key] === "number" && key !== "total" && key !== "unmarked") {
        (summary[key] as number) += 1;
      }
    }

    return {
      employeeId: e.id,
      name: e.name,
      department: e.department,
      role: e.role,
      record: rec
        ? {
            id: rec.id,
            status: rec.status,
            clockIn: rec.clockIn,
            clockOut: rec.clockOut,
            hoursWorked: rec.hoursWorked,
            notes: rec.notes,
          }
        : null,
    };
  });

  return { workDate, summary, rows };
}

export async function getRecentAttendance(limit = 30) {
  await ensureDemoTeam();
  const db = getCeoDb();
  return db.employeeAttendance.findMany({
    orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      employee: { select: { id: true, name: true, department: true } },
    },
  });
}

function computeHours(clockIn?: Date | null, clockOut?: Date | null): number | null {
  if (!clockIn || !clockOut) return null;
  const ms = clockOut.getTime() - clockIn.getTime();
  if (ms <= 0) return null;
  return Math.round((ms / 3_600_000) * 100) / 100;
}

export async function upsertAttendance(input: {
  employeeId: string;
  workDate: string;
  status: string;
  clockIn?: string | null;
  clockOut?: string | null;
  notes?: string | null;
}) {
  await ensureDemoTeam();
  const db = getCeoDb();

  const clockIn = input.clockIn ? new Date(input.clockIn) : null;
  const clockOut = input.clockOut ? new Date(input.clockOut) : null;
  const hoursWorked = computeHours(clockIn, clockOut);

  const record = await db.employeeAttendance.upsert({
    where: {
      employeeId_workDate: {
        employeeId: input.employeeId,
        workDate: input.workDate,
      },
    },
    create: {
      employeeId: input.employeeId,
      workDate: input.workDate,
      status: input.status,
      clockIn,
      clockOut,
      hoursWorked,
      notes: input.notes ?? null,
    },
    update: {
      status: input.status,
      clockIn,
      clockOut,
      hoursWorked,
      notes: input.notes ?? null,
    },
  });

  await logEmployeeActivity({
    employeeId: input.employeeId,
    action: "ATTENDANCE_MARKED",
    entityType: "attendance",
    entityId: record.id,
    metadata: { workDate: input.workDate, status: input.status },
  });

  return record;
}

/** כניסה מהירה להיום — שעת כניסה עכשיו */
export async function clockInToday(employeeId: string, workDate?: string) {
  const date = workDate ?? workDateKey();
  const now = new Date();
  const existing = await getCeoDb().employeeAttendance.findUnique({
    where: { employeeId_workDate: { employeeId, workDate: date } },
  });

  return upsertAttendance({
    employeeId,
    workDate: date,
    status: existing?.status ?? "PRESENT",
    clockIn: now.toISOString(),
    clockOut: existing?.clockOut?.toISOString() ?? null,
    notes: existing?.notes ?? null,
  });
}

export async function clockOutToday(employeeId: string, workDate?: string) {
  const date = workDate ?? workDateKey();
  const now = new Date();
  const existing = await getCeoDb().employeeAttendance.findUnique({
    where: { employeeId_workDate: { employeeId, workDate: date } },
  });

  return upsertAttendance({
    employeeId,
    workDate: date,
    status: existing?.status ?? "PRESENT",
    clockIn: existing?.clockIn?.toISOString() ?? now.toISOString(),
    clockOut: now.toISOString(),
    notes: existing?.notes ?? null,
  });
}
