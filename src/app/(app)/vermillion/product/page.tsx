import Link from "next/link";
import { PrizeCalculatorWidget } from "@/components/vermillion/prize-calculator-widget";
import {
  PRODUCT_KNOWLEDGE_FULL,
  PRODUCT_KNOWLEDGE_VERSION,
  PRODUCT_SPEC_PRIZE_TABLE,
  VERMILLION_GAMES,
} from "@/lib/product-knowledge";

export const dynamic = "force-dynamic";

export default function VermillionProductKnowledgePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" dir="rtl">
      <Link href="/vermillion" className="text-sm text-[var(--accent)] hover:underline">
        ← חזרה למוצר VerMillion
      </Link>

      <header>
        <h1 className="text-2xl font-bold">ידע מוצר — מה ה-CRM יודע</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          גרסה {PRODUCT_KNOWLEDGE_VERSION} · מקור אמת לסוכני AI ולמנכ״ל
        </p>
      </header>

      <PrizeCalculatorWidget />

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 overflow-x-auto">
        <h2 className="mb-3 font-semibold">פרסים שבועיים — קרן דינמית</h2>
        <p className="mb-3 text-sm text-[var(--muted)]">
          נוסחה: 20% תפעול → 80% נטו → 50% קרן פרסים (÷4 שבועות) · 5 הדייקניים ביותר ·
          חלוקה ביחס ימי השתתפות באותו חודש
        </p>
        <p className="mb-3 text-xs text-amber-400/80">
          זכאות: רצף 7 לחיצות מדויקות בחלון 60 שניות סביב DNA לפני תחילת השבוע
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--muted)]">
              <th className="pb-2 text-right">משתמשים</th>
              <th className="pb-2 text-right">קרן שבועית (40% הכנסות ÷4)</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCT_SPEC_PRIZE_TABLE.map((row) => (
              <tr key={row.users} className="border-t border-[var(--border)]/40">
                <td className="py-2 font-medium">{row.users.toLocaleString("he-IL")}</td>
                <td className="py-2">₪{row.weeklyFund.toLocaleString("he-IL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-[var(--muted)]">
          חלוקה בין 5 הזוכים — דינמית לפי ימי השתתפות בחודש. הפרסים גדלים עם הקהילה.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 font-semibold">משחקים ({VERMILLION_GAMES.length})</h2>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {VERMILLION_GAMES.map((g) => (
            <li key={g.key} className="text-[var(--muted)]">
              <span className="font-mono text-xs text-white/80">{g.key}</span> — {g.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="mb-3 font-semibold">חוזה מוצר מלא</h2>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--muted)]">
          {PRODUCT_KNOWLEDGE_FULL}
        </pre>
      </section>
    </div>
  );
}
