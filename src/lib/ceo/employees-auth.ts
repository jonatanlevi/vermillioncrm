import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  permissionsToJson,
  type PermissionMap,
  parsePermissions,
} from "@/lib/auth/permissions";
import { logEmployeeActivity } from "./activity";

export type CrmEmployeeRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  accessRole: string;
  permissions: string;
  isActive: boolean;
  status: string;
  hasPassword: boolean;
};

export async function listCrmEmployees(): Promise<CrmEmployeeRow[]> {
  const rows = await db.employee.findMany({
    where: { accessRole: "EMPLOYEE" },
    orderBy: { name: "asc" },
  });

  return rows.map((e) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.role,
    accessRole: e.accessRole,
    permissions: e.permissions,
    isActive: e.isActive,
    status: e.status,
    hasPassword: Boolean(e.passwordHash),
  }));
}

export async function createCrmEmployee(input: {
  name: string;
  email: string;
  password: string;
  permissions: PermissionMap;
  jobRole?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const adminEmail = process.env.CRM_ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && email === adminEmail) {
    throw new Error("אימייל זה שייך למנכ״ל — השתמש בהתחברות מנהל");
  }

  const existing = await db.employee.findUnique({ where: { email } });
  if (existing) throw new Error("אימייל כבר קיים");

  const passwordHash = await bcrypt.hash(input.password, 12);

  const employee = await db.employee.create({
    data: {
      name: input.name.trim(),
      email,
      role: input.jobRole ?? "SALES",
      accessRole: "EMPLOYEE",
      passwordHash,
      permissions: permissionsToJson(input.permissions),
      isActive: true,
      status: "ACTIVE",
    },
  });

  await logEmployeeActivity({
    employeeId: employee.id,
    action: "EMPLOYEE_CREATED",
    entityType: "employee",
    entityId: employee.id,
    metadata: { crmAccess: true },
  });

  return employee;
}

export async function updateCrmEmployee(
  id: string,
  input: {
    permissions?: PermissionMap;
    password?: string;
    isActive?: boolean;
    name?: string;
  }
) {
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee || employee.accessRole !== "EMPLOYEE") {
    throw new Error("עובד לא נמצא");
  }

  const data: {
    permissions?: string;
    passwordHash?: string;
    isActive?: boolean;
    status?: string;
    name?: string;
  } = {};

  if (input.permissions) data.permissions = permissionsToJson(input.permissions);
  if (input.password) data.passwordHash = await bcrypt.hash(input.password, 12);
  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
    data.status = input.isActive ? "ACTIVE" : "INACTIVE";
  }
  if (input.name) data.name = input.name.trim();

  const updated = await db.employee.update({ where: { id }, data });

  await logEmployeeActivity({
    employeeId: id,
    action: input.isActive === false ? "EMPLOYEE_DEACTIVATED" : "EMPLOYEE_UPDATED",
    entityType: "employee",
    entityId: id,
    metadata: {
      permissions: input.permissions ? parsePermissions(updated.permissions) : undefined,
    },
  });

  return updated;
}
