export function PrismaSetupBanner() {
  return (
    <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-6 text-sm">
      <p className="font-semibold text-amber-200">נדרש עדכון Prisma</p>
      <p className="mt-2 text-[var(--muted)]">
        נוספו מודולים (עובדים / נוכחות) — יש לרענן את לקוח Prisma. בטרמינל:
      </p>
      <pre className="mt-3 overflow-x-auto rounded bg-black/40 p-3 text-xs" dir="ltr">
{`# עצור npm run dev (Ctrl+C), ואז:
npx prisma generate
npm run dev`}
      </pre>
    </div>
  );
}
