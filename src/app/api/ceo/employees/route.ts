import { NextResponse } from "next/server";
import { requireCeoSession, apiUnauthorized } from "@/lib/auth/session";
import { createEmployee } from "@/lib/ceo/employees";
import { createCrmEmployee } from "@/lib/ceo/employees-auth";
import type { PermissionMap } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireCeoSession();
  if (!session) return apiUnauthorized();

  try {
    const body = await req.json();

    if (body.crmAccess && body.password) {
      if (!body.name?.trim() || !body.username?.trim()) {
        return NextResponse.json(
          { ok: false, error: "שם ושם משתמש חובה" },
          { status: 400 }
        );
      }
      const employee = await createCrmEmployee({
        name: body.name,
        username: body.username,
        password: body.password,
        permissions: (body.permissions ?? {}) as PermissionMap,
        jobRole: body.jobRole,
      });
      return NextResponse.json({
        ok: true,
        employee: { id: employee.id, name: employee.name },
      });
    }

    if (!body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { ok: false, error: "שם ואימייל חובה" },
        { status: 400 }
      );
    }

    const employee = await createEmployee({
      name: body.name,
      email: body.email,
      role: body.role ?? "SALES",
      department: body.department,
      phone: body.phone,
      status: body.status ?? "ACTIVE",
      hiredAt: body.hiredAt,
      managerId: body.managerId,
    });

    return NextResponse.json({ ok: true, employee: { id: employee.id, name: employee.name } });
  } catch (e) {
    const message =
      e instanceof Error && e.message.includes("Unique constraint")
        ? "אימייל כבר קיים במערכת"
        : e instanceof Error
          ? e.message
          : "שגיאה";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
