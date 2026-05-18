import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCeoSession, apiUnauthorized } from "@/lib/auth/session";
import { deleteAppUserEverywhere } from "@/lib/vermillion/admin";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await requireCeoSession();
  if (!session) return apiUnauthorized();

  const { userId } = await params;
  let body: { confirmed?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  if (!body.confirmed) {
    return NextResponse.json(
      { ok: false, error: "נדרש אישור מחיקה" },
      { status: 400 }
    );
  }

  const record = await db.appUser.findUnique({ where: { externalId: userId } });
  if (!record) {
    return NextResponse.json({ ok: false, error: "משתמש לא נמצא ב-CRM" }, { status: 404 });
  }

  if (record.ceoDeletedAt) {
    return NextResponse.json(
      { ok: false, error: "משתמש זה כבר נמחק על ידי מנכ״ל" },
      { status: 400 }
    );
  }

  if (record.deletedAt && !record.ceoDeletedAt) {
    return NextResponse.json(
      { ok: false, error: "משתמש זה כבר מסומן כנטש — אין חשבון פעיל למחיקה" },
      { status: 400 }
    );
  }

  const result = await deleteAppUserEverywhere(userId);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ ok: true, deletedId: userId });
}
