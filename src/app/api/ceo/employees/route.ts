import { NextResponse } from "next/server";
import { createEmployee } from "@/lib/ceo/employees";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

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
