import { db } from "@/lib/db";

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

/** בדיקה ל-.env בלבד — בטוח ל-Edge (middleware). */
export function hasCrmAdminFromEnv(): boolean {
  const envUser =
    process.env.CRM_ADMIN_USERNAME?.trim() || process.env.CRM_ADMIN_EMAIL?.trim();
  const envPass = process.env.CRM_ADMIN_PASSWORD?.trim();
  return Boolean(envUser && envPass);
}

/** יש מנהל — מ-.env או מחשבון מנכ״ל ב-DB (Node.js בלבד, לא middleware). */
export async function hasCrmAdmin(): Promise<boolean> {
  const envUser =
    process.env.CRM_ADMIN_USERNAME?.trim() || process.env.CRM_ADMIN_EMAIL?.trim();
  if (envUser) return true;

  const count = await db.employee.count({
    where: {
      accessRole: "CEO",
      username: { not: null },
      passwordHash: { not: null },
      isActive: true,
    },
  });
  return count > 0;
}

export async function needsInitialSetup(): Promise<boolean> {
  return !(await hasCrmAdmin());
}
