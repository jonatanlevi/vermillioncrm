import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PendingApprovals } from "@/components/ceo/pending-approvals";
import { listPendingSignups } from "@/lib/ceo/signup-approvals";

export const dynamic = "force-dynamic";

export default async function CeoApprovalsPage() {
  const session = await auth();
  if (session?.user?.role !== "CEO") {
    redirect("/unauthorized");
  }

  const pending = await listPendingSignups();

  return (
    <div className="space-y-6" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">אישור הרשמות עובדים</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            עובד שנרשם בעצמו ממתין כאן — רק אחרי אישור יוכל להתחבר
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/ceo/employees"
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-white/5"
          >
            ניהול עובדים
          </Link>
          <Link
            href="/register?mode=employee"
            className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white"
          >
            + הוסף עובד (מיידי)
          </Link>
        </div>
      </header>

      <PendingApprovals pending={pending} />
    </div>
  );
}
