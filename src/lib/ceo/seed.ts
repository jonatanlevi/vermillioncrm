import { getCeoDb } from "./db-access";
import { logEmployeeActivity } from "./activity";
import { workDateKey } from "./attendance";

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

/** צוות לדוגמה — רק אם אין עובדים */
export async function ensureDemoTeam() {
  const db = getCeoDb();
  const count = await db.employee.count();
  if (count > 0) return;

  const ceo = await db.employee.create({
    data: {
      email: "ceo@vermillion.app",
      name: "מנכ״ל VerMillion",
      role: "CEO",
      department: "הנהלה",
      status: "ACTIVE",
      hiredAt: new Date("2025-01-01"),
    },
  });

  const dana = await db.employee.create({
    data: {
      email: "dana@vermillion.app",
      name: "דנה כהן",
      role: "SALES",
      department: "מכירות",
      phone: "050-1111111",
      status: "ACTIVE",
      managerId: ceo.id,
      hiredAt: new Date("2025-03-01"),
    },
  });

  const yossi = await db.employee.create({
    data: {
      email: "yossi@vermillion.app",
      name: "יוסי לוי",
      role: "MARKETING",
      department: "שיווק",
      status: "ACTIVE",
      managerId: ceo.id,
      hiredAt: new Date("2025-04-15"),
    },
  });

  const michal = await db.employee.create({
    data: {
      email: "michal@vermillion.app",
      name: "מיכל אברהם",
      role: "SUPPORT",
      department: "תמיכה",
      status: "ACTIVE",
      managerId: ceo.id,
      hiredAt: new Date("2025-06-01"),
    },
  });

  const mk = monthKey();

  for (const [emp, metric, target, actual] of [
    [dana, "deals_closed", 8, 3],
    [dana, "sales_amount", 50000, 18500],
    [yossi, "campaigns", 6, 2],
    [michal, "whatsapp_sent", 120, 45],
  ] as const) {
    await db.employeeGoal.create({
      data: {
        employeeId: emp.id,
        monthKey: mk,
        metric,
        targetValue: target,
        actualValue: actual,
      },
    });
  }

  const activities = [
    { employeeId: dana.id, action: "SALE_CREATED", entityType: "sale" },
    { employeeId: yossi.id, action: "CAMPAIGN_CREATED", entityType: "campaign" },
    { employeeId: michal.id, action: "WHATSAPP_SENT", entityType: "whatsapp" },
    { employeeId: yossi.id, action: "AGENT_RUN", entityType: "agent_run" },
    { employeeId: dana.id, action: "SALE_WON", entityType: "sale" },
  ];

  for (const a of activities) {
    await logEmployeeActivity(a);
  }

  await seedDemoAttendanceRecords();
}

/** נתוני נוכחות לדוגמה — גם אם הצוות כבר קיים */
export async function seedDemoAttendanceRecords() {
  const client = getCeoDb();
  if (!client.employeeAttendance) return;

  const staff = await client.employee.findMany({
    where: { role: { not: "CEO" } },
    take: 3,
  });
  if (staff.length === 0) return;
  await seedDemoAttendance(client, staff);
}

async function seedDemoAttendance(
  db: ReturnType<typeof getCeoDb>,
  staff: { id: string }[]
) {
  const existing = await db.employeeAttendance.count();
  if (existing > 0) return;

  const statuses = ["PRESENT", "PRESENT", "LATE", "REMOTE", "ABSENT"] as const;

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    const wd = workDateKey(d);

    for (let i = 0; i < staff.length; i++) {
      const status = statuses[(dayOffset + i) % statuses.length];
      if (status === "ABSENT" && dayOffset === 0) continue;

      const base = new Date(wd + "T09:00:00");
      const clockIn = new Date(base);
      if (status === "LATE") clockIn.setHours(10, 15, 0, 0);
      const clockOut = new Date(wd + "T17:30:00");

      await db.employeeAttendance.create({
        data: {
          employeeId: staff[i].id,
          workDate: wd,
          status,
          clockIn: status === "ABSENT" ? null : clockIn,
          clockOut: status === "ABSENT" ? null : clockOut,
          hoursWorked:
            status === "ABSENT"
              ? null
              : Math.round(((clockOut.getTime() - clockIn.getTime()) / 3_600_000) * 10) / 10,
        },
      });
    }
  }
}
