import Link from "next/link";
import { EmployeeForm } from "@/components/ceo/employee-form";
import { listEmployeesForSelect } from "@/lib/ceo/employees";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  const managers = await listEmployeesForSelect();

  return (
    <div className="space-y-6">
      <header>
        <Link href="/ceo/team" className="text-sm text-[var(--accent)] hover:underline">
          ← חזרה לצוות
        </Link>
        <h1 className="mt-2 text-2xl font-bold">עובד חדש</h1>
        <p className="text-sm text-[var(--muted)]">
          הוספת עובד לצוות הפנימי — לא משתמש אפליקציה
        </p>
      </header>
      <EmployeeForm managers={managers.map((m) => ({ id: m.id, name: m.name }))} />
    </div>
  );
}
