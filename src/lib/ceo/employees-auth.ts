import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  permissionsToJson,
  type PermissionMap,
  parsePermissions,
} from "@/lib/auth/permissions";
import { logEmployeeActivity } from "./activity";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export type CrmEmployeeRow = {
  id: string;
  name: string;
  username: string;
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
    where: {
      accessRole: "EMPLOYEE",
      username: { not: null },
      approvalStatus: "APPROVED",
    },
    orderBy: { name: "asc" },
  });

  return rows
    .filter((e) => e.username)
    .map((e) => ({
      id: e.id,
      name: e.name,
      username: e.username!,
      email: e.email,
      role: e.role,
      accessRole: e.accessRole,
      permissions: e.permissions,
      isActive: e.isActive,
      status: e.status,
      hasPassword: Boolean(e.passwordHash),
    }));
}

export async function createInitialCeo(input: {
  name: string;
  username: string;
  password: string;
}) {
  const { needsInitialSetup } = await import("@/lib/auth/setup");
  if (!(await needsInitialSetup())) {
    throw new Error("כבר קיים מנהל במערכת — התחבר או הוסף עובדים כמנכ״ל");
  }

  const username = normalizeUsername(input.username);
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("שם משתמש: 3–32 תווים, אותיות באנגלית, מספרים, נקודה, מקף או קו תחתון");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const email = `${username}@crm.vermillion.local`;

  const employee = await db.employee.create({
    data: {
      name: input.name.trim(),
      username,
      email,
      role: "CEO",
      accessRole: "CEO",
      passwordHash,
      permissions: JSON.stringify({ all: true }),
      isActive: true,
      status: "ACTIVE",
      approvalStatus: "APPROVED",
    },
  });

  await logEmployeeActivity({
    employeeId: employee.id,
    action: "EMPLOYEE_CREATED",
    entityType: "employee",
    entityId: employee.id,
    metadata: { initialCeo: true, username },
  });

  return employee;
}

export async function createCrmEmployee(input: {
  name: string;
  username: string;
  password: string;
  permissions: PermissionMap;
  jobRole?: string;
}) {
  const username = normalizeUsername(input.username);
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("שם משתמש: 3–32 תווים, אותיות באנגלית, מספרים, נקודה, מקף או קו תחתון");
  }

  const adminUser =
    process.env.CRM_ADMIN_USERNAME?.trim() ||
    process.env.CRM_ADMIN_EMAIL?.trim();
  if (adminUser && username === normalizeUsername(adminUser)) {
    throw new Error("שם משתמש זה שייך למנכ״ל");
  }

  const existingUser = await db.employee.findUnique({ where: { username } });
  if (existingUser) throw new Error("שם משתמש כבר קיים");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const email = `${username}@crm.vermillion.local`;

  const employee = await db.employee.create({
    data: {
      name: input.name.trim(),
      username,
      email,
      role: input.jobRole ?? "SALES",
      accessRole: "EMPLOYEE",
      passwordHash,
      permissions: permissionsToJson(input.permissions),
      isActive: true,
      status: "ACTIVE",
      approvalStatus: "APPROVED",
    },
  });

  await logEmployeeActivity({
    employeeId: employee.id,
    action: "EMPLOYEE_CREATED",
    entityType: "employee",
    entityId: employee.id,
    metadata: { crmAccess: true, username },
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
  if (!employee || employee.accessRole !== "EMPLOYEE" || !employee.username) {
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
