"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AGENT_META, type AgentId } from "@/lib/types/agents";

const NAV: AgentId[] = [
  "vermillion",
  "campaigns",
  "finance",
  "whatsapp",
  "sales",
  "media",
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-4 py-5">
        <Link href="/" className="block">
          <span className="text-lg font-bold text-[var(--accent)]">VerMillion</span>
          <span className="mt-0.5 block text-xs text-[var(--muted)]">מרכז פיקוד עסקי</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        <Link
          href="/"
          className={`block rounded-lg px-3 py-2 text-sm ${
            pathname === "/" ? "bg-[var(--accent-dim)] text-white" : "text-[var(--muted)] hover:bg-white/5"
          }`}
        >
          לוח מנכ״ל
        </Link>
        <div>
          <Link
            href="/ceo"
            className={`block rounded-lg px-3 py-2 text-sm ${
              pathname.startsWith("/ceo")
                ? "bg-[var(--accent-dim)] text-white"
                : "text-[var(--muted)] hover:bg-white/5"
            }`}
          >
            <span className="font-medium">מרכז מנכ״ל</span>
          </Link>
          {pathname.startsWith("/ceo") && (
            <Link
              href="/ceo/attendance"
              className={`mr-3 mt-0.5 block rounded-lg px-3 py-1.5 text-xs ${
                pathname.startsWith("/ceo/attendance")
                  ? "text-white"
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              יומן נוכחות
            </Link>
          )}
        </div>
        {NAV.map((id) => {
          const meta = AGENT_META[id];
          const active = pathname.startsWith(meta.href);
          return (
            <div key={id}>
              <Link
                href={meta.href}
                className={`block rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-[var(--accent-dim)] text-white" : "text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                <span className="font-medium">{meta.titleHe}</span>
              </Link>
              {id === "vermillion" && active && (
                <Link
                  href="/vermillion/users"
                  className={`mr-3 mt-0.5 block rounded-lg px-3 py-1.5 text-xs ${
                    pathname.startsWith("/vermillion/users")
                      ? "text-white"
                      : "text-[var(--muted)] hover:text-white"
                  }`}
                >
                  משתמשים
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border)] p-3 text-xs text-[var(--muted)]">
        AI: Grok → Claude
      </div>
    </aside>
  );
}
