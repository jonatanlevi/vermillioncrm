import { NextResponse } from "next/server";
import {
  clockInToday,
  clockOutToday,
  upsertAttendance,
  workDateKey,
} from "@/lib/ceo/attendance";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action as string | undefined;

    if (action === "clock_in") {
      const record = await clockInToday(body.employeeId, body.workDate);
      return NextResponse.json({ ok: true, record });
    }

    if (action === "clock_out") {
      const record = await clockOutToday(body.employeeId, body.workDate);
      return NextResponse.json({ ok: true, record });
    }

    if (!body.employeeId || !body.status) {
      return NextResponse.json(
        { ok: false, error: "חסרים employeeId או status" },
        { status: 400 }
      );
    }

    const record = await upsertAttendance({
      employeeId: body.employeeId,
      workDate: body.workDate || workDateKey(),
      status: body.status,
      clockIn: body.clockIn ?? null,
      clockOut: body.clockOut ?? null,
      notes: body.notes ?? null,
    });

    return NextResponse.json({ ok: true, record });
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
