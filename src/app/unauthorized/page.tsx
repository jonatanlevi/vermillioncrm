import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] p-6 text-center"
      dir="rtl"
    >
      <h1 className="text-2xl font-bold">אין לך הרשאה לצפות בעמוד זה</h1>
      <p className="max-w-md text-sm text-[var(--muted)]">
        פנה למנכ״ל לעדכון ההרשאות שלך ב-CRM.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
      >
        חזרה
      </Link>
    </div>
  );
}
