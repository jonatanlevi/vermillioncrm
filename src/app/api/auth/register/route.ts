import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { needsInitialSetup } from "@/lib/auth/setup";
import { createInitialCeo, createCrmEmployee } from "@/lib/ceo/employees-auth";
import { createPendingEmployeeSignup } from "@/lib/ceo/signup-approvals";
import type { PermissionMap } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const passwordConfirm = String(body.passwordConfirm ?? "");
    const accessRole = String(body.accessRole ?? "EMPLOYEE");
    const mode = String(body.mode ?? "");

    if (!name || !username || !password) {
      return NextResponse.json(
        { ok: false, error: "שם, שם משתמש וסיסמה חובה" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "סיסמה — לפחות 8 תווים" },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { ok: false, error: "הסיסמאות אינן תואמות" },
        { status: 400 }
      );
    }

    if (accessRole === "CEO") {
      if (!(await needsInitialSetup())) {
        return NextResponse.json(
          { ok: false, error: "הגדרה ראשונית כבר בוצעה" },
          { status: 403 }
        );
      }

      const employee = await createInitialCeo({ name, username, password });
      return NextResponse.json({
        ok: true,
        mode: "ceo",
        employee: { id: employee.id, username: employee.username },
      });
    }

    if (mode === "self-signup") {
      if (await needsInitialSetup()) {
        return NextResponse.json(
          { ok: false, error: "יש להשלים הגדרת מנכ״ל תחילה" },
          { status: 403 }
        );
      }

      const { employee } = await createPendingEmployeeSignup({
        name,
        username,
        password,
        jobRole: body.jobRole ?? "SALES",
        department: body.department,
        phone: body.phone,
        permissions: (body.permissions ?? {}) as PermissionMap,
      });

      return NextResponse.json({
        ok: true,
        mode: "pending",
        message:
          "הבקשה נשלחה למנכ״ל. תוכל להתחבר רק אחרי אישור.",
        employee: { id: employee.id, username: employee.username },
      });
    }

    const session = await auth();
    if (!session?.user || session.user.role !== "CEO") {
      return NextResponse.json(
        { ok: false, error: "רק מנכ״ל יכול להוסיף עובדים ישירות" },
        { status: 403 }
      );
    }

    const employee = await createCrmEmployee({
      name,
      username,
      password,
      permissions: (body.permissions ?? {}) as PermissionMap,
      jobRole: body.jobRole ?? "SALES",
    });

    return NextResponse.json({
      ok: true,
      mode: "employee",
      employee: { id: employee.id, username: employee.username },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
