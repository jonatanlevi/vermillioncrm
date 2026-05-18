import { db } from "@/lib/db";

const PIPELINE_STATUSES = ["LEAD", "QUALIFIED", "PROPOSAL"] as const;
const CLOSED_WON = "WON";
const CLOSED_LOST = "LOST";

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfLastMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

function endOfLastMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59);
}

export async function getSalesDashboardData() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfLastMonth(now);
  const lastMonthEnd = endOfLastMonth(now);

  const [
    allSales,
    pipelineGroup,
    wonSales,
    lostCount,
    monthWon,
    lastMonthWon,
    customersCount,
    newCustomersMonth,
    recentSales,
    staleLeads,
  ] = await Promise.all([
    db.sale.findMany({ select: { amount: true, status: true } }),
    db.sale.groupBy({
      by: ["status"],
      _count: true,
      _sum: { amount: true },
    }),
    db.sale.findMany({
      where: { status: CLOSED_WON },
      select: { amount: true, closedAt: true, createdAt: true },
    }),
    db.sale.count({ where: { status: CLOSED_LOST } }),
    db.sale.aggregate({
      where: { status: CLOSED_WON, closedAt: { gte: monthStart } },
      _sum: { amount: true },
      _count: true,
    }),
    db.sale.aggregate({
      where: {
        status: CLOSED_WON,
        closedAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { amount: true },
    }),
    db.customer.count(),
    db.customer.count({ where: { createdAt: { gte: monthStart } } }),
    db.sale.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { customer: { select: { name: true } } },
    }),
    db.sale.findMany({
      where: {
        status: { in: ["LEAD", "QUALIFIED"] },
        updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { updatedAt: "asc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
  ]);

  const pipelineValue = allSales
    .filter((s) => PIPELINE_STATUSES.includes(s.status as (typeof PIPELINE_STATUSES)[number]))
    .reduce((sum, s) => sum + s.amount, 0);

  const totalRevenue = wonSales.reduce((sum, s) => sum + s.amount, 0);
  const revenueThisMonth = monthWon._sum.amount ?? 0;
  const revenueLastMonth = lastMonthWon._sum.amount ?? 0;
  const revenueGrowth =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : revenueThisMonth > 0
        ? 100
        : 0;

  const closedTotal = wonSales.length + lostCount;
  const winRate = closedTotal > 0 ? (wonSales.length / closedTotal) * 100 : 0;

  const openDeals = allSales.filter((s) =>
    PIPELINE_STATUSES.includes(s.status as (typeof PIPELINE_STATUSES)[number])
  ).length;

  const avgDealSize =
    wonSales.length > 0 ? totalRevenue / wonSales.length : 0;

  const pipeline = ["LEAD", "QUALIFIED", "PROPOSAL", "WON", "LOST"].map((status) => {
    const row = pipelineGroup.find((g) => g.status === status);
    return {
      status,
      count: row?._count ?? 0,
      value: row?._sum.amount ?? 0,
    };
  });

  const statusLabels: Record<string, string> = {
    LEAD: "ליד",
    QUALIFIED: "מוסמך",
    PROPOSAL: "הצעה",
    WON: "נסגר ✓",
    LOST: "הפסד",
  };

  return {
    kpis: {
      revenueThisMonth,
      revenueGrowth,
      pipelineValue,
      openDeals,
      winRate,
      avgDealSize,
      totalRevenue,
      customersCount,
      newCustomersMonth,
      dealsWonMonth: monthWon._count,
    },
    pipeline: pipeline.map((p) => ({
      ...p,
      label: statusLabels[p.status] ?? p.status,
    })),
    recentSales: recentSales.map((s) => ({
      id: s.id,
      title: s.title,
      amount: s.amount,
      status: s.status,
      customerName: s.customer?.name,
      updatedAt: s.updatedAt.toISOString(),
    })),
    staleLeads: staleLeads.map((s) => ({
      id: s.id,
      title: s.title,
      amount: s.amount,
      status: s.status,
      customerName: s.customer?.name,
      updatedAt: s.updatedAt.toISOString(),
    })),
  };
}

export type SalesDashboardData = Awaited<ReturnType<typeof getSalesDashboardData>>;
