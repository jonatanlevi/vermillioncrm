import { NextResponse } from "next/server";
import { requireCeoSession, apiUnauthorized } from "@/lib/auth/session";
import { updateCrmEmployee } from "@/lib/ceo/employees-auth";
import type { PermissionMap } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCeoSession();
  if (!session) return apiUnauthorized();

  const { id } = await params;

  try {
    const body = await req.json();
    await updateCrmEmployee(id, {
      permissions: body.permissions as PermissionMap | undefined,
      password: body.password as string | undefined,
      isActive: body.isActive as boolean | undefined,
      name: body.name as string | undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCeoSession();
  if (!session) return apiUnauthorized();

  const { id } = await params;

  try {
    await updateCrmEmployee(id, { isActive: false });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
