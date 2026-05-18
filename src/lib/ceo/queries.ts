import { getCeoDb } from "./db-access";
import { getAppProductSnapshot, type AppProductSnapshot } from "./product-snapshot";
import { ensureDemoTeam } from "./seed";
import { listPendingSignups } from "./signup-approvals";

function monthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function roleLabelFromQueries(role: string) {
  const labels: Record<string, string> = {
    CEO: "מנכ״ל",
    SALES: "מכירות",
    MARKETING: "שיווק",
    FINANCE: "כספים",
    SUPPORT: "תמיכה",
    OPS: "תפעול",
  };
  return labels[role] ?? role;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export type EmployeePerformanceRow = {
  id: string;
  name: string;
  role: string;
  department: string | null;
  status: string;
  openDeals: number;
  wonDealsMonth: number;
  salesAmountMonth: number;
  campaigns: number;
  whatsappSent: number;
  agentRuns: number;
  goalPercent: number;
  lastActivityAt: Date | null;
};

export type CeoDashboard = {
  monthKey: string;
  product: AppProductSnapshot;
  activeEmployees: number;
  openDeals: number;
  wonDealsMonth: number;
  salesAmountMonth: number;
  campaignsMonth: number;
  whatsappMonth: number;
  agentRunsMonth: number;
  team: EmployeePerformanceRow[];
  alerts: { type: string; message: string; employeeId?: string; href?: string }[];
  recentActivity: {
    id: string;
    employeeName: string;
    action: string;
    createdAt: Date;
  }[];
};

export async function getCeoDashboard(): Promise<CeoDashboard> {
  const [product] = await Promise.all([getAppProductSnapshot()]);
  await ensureDemoTeam();

  const ceoDb = getCeoDb();
  const mk = monthKey();
  const monthStart = startOfMonth();

  const employees = await ceoDb.employee.findMany({
    orderBy: { name: "asc" },
    include: {
      goals: { where: { monthKey: mk } },
      activities: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const [
    openDeals,
    wonDealsMonth,
    salesAgg,
    campaignsMonth,
    whatsappMonth,
    agentRunsMonth,
    recentActivity,
  ] = await Promise.all([
    ceoDb.sale.count({ where: { status: { notIn: ["WON", "LOST"] } } }),
    ceoDb.sale.count({
      where: { status: "WON", closedAt: { gte: monthStart } },
    }),
    ceoDb.sale.aggregate({
      where: { status: "WON", closedAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    ceoDb.campaign.count({ where: { createdAt: { gte: monthStart } } }),
    ceoDb.whatsappMessage.count({
      where: { direction: "OUTBOUND", createdAt: { gte: monthStart } },
    }),
    ceoDb.agentRun.count({ where: { startedAt: { gte: monthStart } } }),
    ceoDb.employeeActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { employee: { select: { name: true } } },
    }),
  ]);

  const team: EmployeePerformanceRow[] = await Promise.all(
    employees.map(async (e) => {
      const [openDeals, wonDealsMonth, salesAgg, campaigns, whatsappSent, agentRuns] =
        await Promise.all([
          ceoDb.sale.count({
            where: { assignedEmployeeId: e.id, status: { notIn: ["WON", "LOST"] } },
          }),
          ceoDb.sale.count({
            where: {
              assignedEmployeeId: e.id,
              status: "WON",
              closedAt: { gte: monthStart },
            },
          }),
          ceoDb.sale.aggregate({
            where: {
              assignedEmployeeId: e.id,
              status: "WON",
              closedAt: { gte: monthStart },
            },
            _sum: { amount: true },
          }),
          ceoDb.campaign.count({
            where: { ownerEmployeeId: e.id, createdAt: { gte: monthStart } },
          }),
          ceoDb.whatsappMessage.count({
            where: {
              sentByEmployeeId: e.id,
              direction: "OUTBOUND",
              createdAt: { gte: monthStart },
            },
          }),
          ceoDb.agentRun.count({
            where: { employeeId: e.id, startedAt: { gte: monthStart } },
          }),
        ]);

      const goalPercents = e.goals.map((g) =>
        g.targetValue > 0 ? (g.actualValue / g.targetValue) * 100 : 0
      );
      const goalPercent =
        goalPercents.length > 0
          ? Math.round(
              goalPercents.reduce((a, b) => a + b, 0) / goalPercents.length
            )
          : 0;

      return {
        id: e.id,
        name: e.name,
        role: e.role,
        department: e.department,
        status: e.status,
        openDeals,
        wonDealsMonth,
        salesAmountMonth: salesAgg._sum.amount ?? 0,
        campaigns,
        whatsappSent,
        agentRuns,
        goalPercent,
        lastActivityAt: e.activities[0]?.createdAt ?? null,
      };
    })
  );

  const alerts: CeoDashboard["alerts"] = [];
  const pendingSignups = await listPendingSignups();
  for (const p of pendingSignups) {
    alerts.push({
      type: "signup_pending",
      message: `בקשת הרשמה: ${p.name} (@${p.username}) — ${roleLabelFromQueries(p.role)}`,
      employeeId: p.id,
      href: "/ceo/approvals",
    });
  }
  const threeDaysAgo = daysAgo(3);

  for (const row of team) {
    if (row.status !== "ACTIVE") continue;
    if (!row.lastActivityAt || row.lastActivityAt < threeDaysAgo) {
      alerts.push({
        type: "inactive",
        message: `${row.name} — ללא פעילות 3+ ימים`,
        employeeId: row.id,
      });
    }
    if (row.goalPercent > 0 && row.goalPercent < 50) {
      alerts.push({
        type: "goal",
        message: `${row.name} — מתחת ל-50% מהיעד החודשי`,
        employeeId: row.id,
      });
    }
  }

  return {
    monthKey: mk,
    product,
    activeEmployees: employees.filter(
      (e) => e.status === "ACTIVE" && e.approvalStatus === "APPROVED"
    ).length,
    openDeals,
    wonDealsMonth,
    salesAmountMonth: salesAgg._sum.amount ?? 0,
    campaignsMonth,
    whatsappMonth,
    agentRunsMonth,
    team: team.sort((a, b) => b.goalPercent - a.goalPercent),
    alerts,
    recentActivity: recentActivity.map((a) => ({
      id: a.id,
      employeeName: a.employee.name,
      action: a.action,
      createdAt: a.createdAt,
    })),
  };
}

export async function getEmployeesList() {
  await ensureDemoTeam();
  return getCeoDb().employee.findMany({
    orderBy: { name: "asc" },
    include: {
      manager: { select: { name: true } },
      _count: { select: { activities: true, goals: true } },
    },
  });
}

export async function getEmployeeDetail(id: string) {
  await ensureDemoTeam();
  const mk = monthKey();
  const monthStart = startOfMonth();

  const ceoDb = getCeoDb();
  const employee = await ceoDb.employee.findUnique({
    where: { id },
    include: {
      manager: { select: { name: true } },
      goals: { where: { monthKey: mk } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      sales: { orderBy: { updatedAt: "desc" }, take: 10 },
      campaigns: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!employee) return null;

  const [wonMonth, salesSum, agentRuns] = await Promise.all([
    ceoDb.sale.count({
      where: {
        assignedEmployeeId: id,
        status: "WON",
        closedAt: { gte: monthStart },
      },
    }),
    ceoDb.sale.aggregate({
      where: {
        assignedEmployeeId: id,
        status: "WON",
        closedAt: { gte: monthStart },
      },
      _sum: { amount: true },
    }),
    ceoDb.agentRun.count({
      where: { employeeId: id, startedAt: { gte: monthStart } },
    }),
  ]);

  return {
    ...employee,
    stats: {
      wonDealsMonth: wonMonth,
      salesAmountMonth: salesSum._sum.amount ?? 0,
      agentRunsMonth: agentRuns,
    },
  };
}

export async function getActivityLog(limit = 50) {
  await ensureDemoTeam();
  return getCeoDb().employeeActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { employee: { select: { id: true, name: true, role: true } } },
  });
}
