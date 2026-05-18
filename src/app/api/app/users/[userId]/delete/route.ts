import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteAppUserEverywhere } from "@/lib/vermillion/admin";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  let body: { confirmEmail?: string; email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const record = await db.appUser.findUnique({ where: { externalId: userId } });
  if (!record) {
    return NextResponse.json({ ok: false, error: "משתמש לא נמצא ב-CRM" }, { status: 404 });
  }

  if (body.confirmEmail && record.email && body.confirmEmail !== record.email) {
    return NextResponse.json(
      { ok: false, error: "אימייל האישור לא תואם" },
      { status: 400 }
    );
  }

  const result = await deleteAppUserEverywhere(userId);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json({ ok: true, deletedId: userId });
}
