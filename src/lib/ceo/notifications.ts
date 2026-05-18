import { db } from "@/lib/db";

export async function createCeoNotification(input: {
  type: string;
  title: string;
  message: string;
  employeeId?: string;
  payload?: Record<string, unknown>;
}) {
  return db.ceoNotification.create({
    data: {
      type: input.type,
      title: input.title,
      message: input.message,
      employeeId: input.employeeId,
      payload: JSON.stringify(input.payload ?? {}),
    },
  });
}

export async function countUnreadSignupNotifications() {
  return db.ceoNotification.count({
    where: {
      type: "EMPLOYEE_SIGNUP_PENDING",
      resolvedAt: null,
    },
  });
}

export async function listOpenSignupNotifications() {
  return db.ceoNotification.findMany({
    where: {
      type: "EMPLOYEE_SIGNUP_PENDING",
      resolvedAt: null,
    },
    orderBy: { createdAt: "desc" },
    include: {
      employee: true,
    },
  });
}

export async function resolveSignupNotification(employeeId: string) {
  await db.ceoNotification.updateMany({
    where: {
      employeeId,
      type: "EMPLOYEE_SIGNUP_PENDING",
      resolvedAt: null,
    },
    data: { resolvedAt: new Date(), readAt: new Date() },
  });
}
