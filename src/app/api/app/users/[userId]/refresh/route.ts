import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { refreshOneAppUser } from "@/lib/vermillion/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const result = await refreshOneAppUser(userId);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  revalidatePath(`/vermillion/users/${userId}`);
  revalidatePath("/vermillion/users");
  return NextResponse.json({ ok: true });
}
