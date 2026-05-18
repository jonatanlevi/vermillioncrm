import Link from "next/link";
import { getEmployeesList } from "@/lib/ceo/queries";
import { roleLabel, statusLabel } from "@/lib/ceo/constants";

export async function TeamTable() {
  const employees = await getEmployeesList();

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-black/20 text-[var(--muted)]">
            <th className="px-3 py-3 text-right">שם</th>
            <th className="px-3 py-3 text-right">אימייל</th>
            <th className="px-3 py-3 text-right">תפקיד</th>
            <th className="px-3 py-3 text-right">מחלקה</th>
            <th className="px-3 py-3 text-right">מנהל</th>
            <th className="px-3 py-3 text-right">סטטוס</th>
            <th className="px-3 py-3 text-right">פעילות</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((e) => (
            <tr
              key={e.id}
              className="border-b border-[var(--border)]/40 hover:bg-white/5"
            >
              <td className="px-3 py-2">
                <Link
                  href={`/ceo/team/${e.id}`}
                  className="font-medium text-[var(--accent)] hover:underline"
                >
                  {e.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-[var(--muted)]">{e.email}</td>
              <td className="px-3 py-2">{roleLabel(e.role)}</td>
              <td className="px-3 py-2">{e.department ?? "—"}</td>
              <td className="px-3 py-2">{e.manager?.name ?? "—"}</td>
              <td className="px-3 py-2">{statusLabel(e.status)}</td>
              <td className="px-3 py-2">{e._count.activities}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
