import { auth } from "@/auth";
import { parsePermissions } from "@/lib/auth/permissions";
import { NextResponse } from "next/server";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}

export async function requireCeoSession() {
  const session = await requireSession();
  if (!session) return null;
  if (session.user.role !== "CEO") return null;
  return session;
}

/** מנכ״ל מערכת או עובד עם הרשאת מודול /ceo */
export async function requireCeoModuleAccess() {
  const session = await requireSession();
  if (!session) return null;
  if (session.user.role === "CEO") return session;
  if (parsePermissions(session.user.permissions).ceo) return session;
  return null;
}

export function apiUnauthorized() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
}

export function apiUnauthenticated() {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
