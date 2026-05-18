import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { EmployeesAdmin } from "@/components/ceo/employees-admin";
import { listCrmEmployees } from "@/lib/ceo/employees-auth";

export const dynamic = "force-dynamic";

export default async function CeoEmployeesPage() {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "CEO") {
    redirect("/unauthorized");
  }

  const employees = await listCrmEmployees();

  return (
    <div className="space-y-6" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ניהול עובדים — הרשאות CRM</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            הוסף עובדים, הגדר סיסמה והרשאות למודולים
          </p>
        </div>
        <Link href="/ceo" className="text-sm text-[var(--accent)] hover:underline">
          ← חזרה למרכז מנכ״ל
        </Link>
      </header>

      <EmployeesAdmin employees={employees} />
    </div>
  );
}
