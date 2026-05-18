import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  permissionsToJson,
  parsePermissions,
  type PermissionMap,
  PERMISSION_LABELS,
  type PermissionKey,
} from "@/lib/auth/permissions";
import { logEmployeeActivity } from "./activity";
import { createCeoNotification, resolveSignupNotification } from "./notifications";
import { roleLabel } from "./constants";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export type PendingSignupRow = {
  id: string;
  name: string;
  username: string;
  role: string;
  department: string | null;
  phone: string | null;
  permissions: Record<PermissionKey, boolean>;
  createdAt: Date;
  notificationId: string | null;
};

export async function createPendingEmployeeSignup(input: {
  name: string;
  username: string;
  password: string;
  jobRole: string;
  department?: string;
  phone?: string;
  permissions: PermissionMap;
}) {
  const username = normalizeUsername(input.username);
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("שם משתמש: 3–32 תווים, אותיות באנגלית, מספרים, נקודה, מקף או קו תחתון");
  }

  const adminUser =
    process.env.CRM_ADMIN_USERNAME?.trim() || process.env.CRM_ADMIN_EMAIL?.trim();
  if (adminUser && username === normalizeUsername(adminUser)) {
    throw new Error("שם משתמש זה לא זמין");
  }

  const existing = await db.employee.findFirst({
    where: {
      OR: [{ username }, { email: `${username}@crm.vermillion.local` }],
    },
  });
  if (existing) {
    if (existing.approvalStatus === "PENDING") {
      throw new Error("בקשה עם שם משתמש זה כבר ממתינה לאישור");
    }
    throw new Error("שם משתמש כבר קיים");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const perms = permissionsToJson(input.permissions);
  const permLabels = (Object.keys(parsePermissions(perms)) as PermissionKey[])
    .filter((k) => parsePermissions(perms)[k])
    .map((k) => PERMISSION_LABELS[k].split(" ")[0])
    .join(", ");

  const employee = await db.employee.create({
    data: {
      name: input.name.trim(),
      username,
      email: `${username}@crm.vermillion.local`,
      role: input.jobRole,
      accessRole: "EMPLOYEE",
      passwordHash,
      permissions: perms,
      approvalStatus: "PENDING",
      isActive: false,
      status: "PENDING",
      department: input.department?.trim() || null,
      phone: input.phone?.trim() || null,
    },
  });

  const notif = await createCeoNotification({
    type: "EMPLOYEE_SIGNUP_PENDING",
    title: "בקשת הרשמת עובד חדש",
    message: `${employee.name} (@${username}) מבקש גישה ל-CRM`,
    employeeId: employee.id,
    payload: {
      name: employee.name,
      username,
      jobRole: employee.role,
      jobRoleLabel: roleLabel(employee.role),
      department: employee.department,
      phone: employee.phone,
      requestedPermissions: parsePermissions(perms),
      permissionSummary: permLabels || "ללא הרשאות",
      createdAt: employee.createdAt.toISOString(),
    },
  });

  return { employee, notificationId: notif.id };
}

export async function listPendingSignups(): Promise<PendingSignupRow[]> {
  const rows = await db.employee.findMany({
    where: { approvalStatus: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  const notifs = await db.ceoNotification.findMany({
    where: {
      type: "EMPLOYEE_SIGNUP_PENDING",
      resolvedAt: null,
      employeeId: { in: rows.map((r) => r.id) },
    },
  });
  const notifByEmployee = new Map(notifs.map((n) => [n.employeeId!, n.id]));

  return rows
    .filter((e) => e.username)
    .map((e) => ({
      id: e.id,
      name: e.name,
      username: e.username!,
      role: e.role,
      department: e.department,
      phone: e.phone,
      permissions: parsePermissions(e.permissions),
      createdAt: e.createdAt,
      notificationId: notifByEmployee.get(e.id) ?? null,
    }));
}

export async function approveEmployeeSignup(
  employeeId: string,
  permissions?: PermissionMap
) {
  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee || employee.approvalStatus !== "PENDING") {
    throw new Error("בקשה לא נמצאה");
  }

  const updated = await db.employee.update({
    where: { id: employeeId },
    data: {
      approvalStatus: "APPROVED",
      isActive: true,
      status: "ACTIVE",
      ...(permissions ? { permissions: permissionsToJson(permissions) } : {}),
    },
  });

  await resolveSignupNotification(employeeId);
  await logEmployeeActivity({
    employeeId,
    action: "EMPLOYEE_APPROVED",
    entityType: "employee",
    entityId: employeeId,
    metadata: { username: employee.username },
  });

  return updated;
}

export async function rejectEmployeeSignup(employeeId: string) {
  const employee = await db.employee.findUnique({ where: { id: employeeId } });
  if (!employee || employee.approvalStatus !== "PENDING") {
    throw new Error("בקשה לא נמצאה");
  }

  await db.employee.update({
    where: { id: employeeId },
    data: {
      approvalStatus: "REJECTED",
      isActive: false,
      status: "INACTIVE",
    },
  });

  await resolveSignupNotification(employeeId);
}
