import { db } from "@/lib/db";

export function normalizeLoginId(value: string) {
  return value
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLowerCase();
}

/** מציאת עובד לפי שם משתמש או אימייל */
export async function findEmployeeForLogin(raw: string) {
  const id = normalizeLoginId(raw);
  if (!id) return null;

  const byUsername = await db.employee.findUnique({ where: { username: id } });
  if (byUsername) return byUsername;

  const byEmail = await db.employee.findUnique({ where: { email: id } });
  if (byEmail) return byEmail;

  // אימייל עם אותיות גדולות / רווחים
  const trimmed = raw.trim();
  if (trimmed !== id) {
    return db.employee.findUnique({ where: { email: trimmed } });
  }

  return null;
}
