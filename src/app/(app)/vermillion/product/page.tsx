import Link from "next/link";
import { PRODUCT_KNOWLEDGE_FULL, PRODUCT_KNOWLEDGE_VERSION, VERMILLION_GAMES } from "@/lib/product-knowledge";

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
