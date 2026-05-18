import { ExecutiveHome } from "@/components/dashboard/executive-home";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)]">
          VerMillion · מרכז פיקוד
        </p>
        <h1 className="mt-1 text-3xl font-bold">לוח מנכ״ל</h1>
        <p className="mt-2 max-w-3xl text-[var(--muted)]">
          תמונת מצב אחת: מוצר (מנויים), צוות (ביצוע), תפעול עסקי (מכירות ושיווק).
          המערכת שמנהלת את VerMillion — לא האפליקציה עצמה.
        </p>
      </header>

      <ExecutiveHome />
    </div>
  );
}
