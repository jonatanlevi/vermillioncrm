import { NextResponse } from "next/server";
import { requireCeoSession, apiUnauthorized } from "@/lib/auth/session";
import {
  approveEmployeeSignup,
  rejectEmployeeSignup,
} from "@/lib/ceo/signup-approvals";
import type { PermissionMap } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCeoSession();
  if (!session) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "approve") {
      await approveEmployeeSignup(id, body.permissions as PermissionMap | undefined);
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      await rejectEmployeeSignup(id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "פעולה לא חוקית" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
