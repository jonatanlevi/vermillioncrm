"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { AGENT_META, type AgentId } from "@/lib/types/agents";

const NAV_AGENTS: AgentId[] = [
  "vermillion",
  "campaigns",
  "finance",
  "whatsapp",
  "sales",
  "media",
];

export type SidebarNavProps = {
  userName?: string | null;
  role: string;
  permissions: Record<string, boolean>;
  showHome: boolean;
  showCeo: boolean;
  showEmployeeAdmin: boolean;
};

export function Sidebar({
  userName,
  role,
  permissions,
  showHome,
  showCeo,
  showEmployeeAdmin,
}: SidebarNavProps) {
  const pathname = usePathname();
  const isCeo = role === "CEO";

  const visibleAgents = NAV_AGENTS.filter((id) => isCeo || permissions[id]);

  return (
    <aside className="flex w-56 shrink-0 flex-col border-l border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-4 py-5">
        <Link href={showHome ? "/" : visibleAgents[0] ? AGENT_META[visibleAgents[0]].href : "/login"} className="block">
          <span className="text-lg font-bold text-[var(--accent)]">VerMillion</span>
          <span className="mt-0.5 block text-xs text-[var(--muted)]">מרכז פיקוד עסקי</span>
        </Link>
        {userName && (
          <p className="mt-2 truncate text-xs text-[var(--muted)]">
            {userName}
            <span className="mr-1 text-[var(--accent)]">
              {isCeo ? " · מנכ״ל" : " · עובד"}
            </span>
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {showHome && (
          <Link
            href="/"
            className={`block rounded-lg px-3 py-2 text-sm ${
              pathname === "/"
                ? "bg-[var(--accent-dim)] text-white"
                : "text-[var(--muted)] hover:bg-white/5"
            }`}
          >
            לוח מנכ״ל
          </Link>
        )}

        {showCeo && (
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
        )}

        {visibleAgents.map((id) => {
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

      <div className="space-y-2 border-t border-[var(--border)] p-3">
        {showEmployeeAdmin && (
          <Link
            href="/ceo/employees"
            className={`block rounded-lg px-3 py-2 text-xs ${
              pathname.startsWith("/ceo/employees")
                ? "bg-[var(--accent-dim)] text-white"
                : "text-[var(--muted)] hover:bg-white/5"
            }`}
          >
            ניהול עובדים
          </Link>
        )}
        <p className="text-xs text-[var(--muted)]">AI: Grok → Claude</p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-white/5"
        >
          התנתקות
        </button>
      </div>
    </aside>
  );
}
