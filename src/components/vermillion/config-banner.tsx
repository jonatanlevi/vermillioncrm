export function VermillionConfigBanner() {
  return (
    <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-sm">
      <p className="font-semibold text-amber-200">מקור יניקה לא מוגדר</p>
      <p className="mt-1 text-[var(--muted)]">
        ה-CRM לא מתחבר ישירות לממשק — רק מייבא נתונים מהאפליקציה לשרת. הוסף ל־
        <code className="text-amber-100">vermillioncrm/.env</code> (שרת בלבד, לא נחשף לדפדפן):
      </p>
      <pre className="mt-3 overflow-x-auto rounded bg-black/40 p-2 text-xs" dir="ltr">
{`VERMILLION_INGESTION_URL=https://YOUR_PROJECT.supabase.co
VERMILLION_INGESTION_SERVICE_KEY=eyJ...   # service_role — יניקה בלבד

# תאימות לאחור (אופציונלי):
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...`}
      </pre>
      <p className="mt-2 text-xs text-[var(--muted)]">
        אחרי שמירה — לחץ «סנכרן עכשיו» במרכז המוצר.
      </p>
    </div>
  );
}
