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
  userEmail?: string | null;
  role: string;
  permissions: Record<string, boolean>;
  showHome: boolean;
  showCeo: boolean;
  showEmployeeAdmin: boolean;
  pendingApprovals?: number;
};

export function Sidebar({
  userName,
  userEmail,
  role,
  permissions,
  showHome,
  showCeo,
  showEmployeeAdmin,
  pendingApprovals = 0,
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
        <p className="mt-2 text-xs">
          {isCeo ? (
            <span className="inline-block rounded-md bg-[var(--accent-dim)] px-2 py-0.5 font-semibold text-white">
              מנכ״ל
            </span>
          ) : (
            <span className="text-[var(--muted)]">עובד</span>
          )}
          <span className="mr-1.5 truncate text-[var(--muted)]">
            {userName || userEmail || "מחובר"}
          </span>
        </p>
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
                pathname === "/ceo"
                  ? "bg-[var(--accent-dim)] text-white"
                  : "text-[var(--muted)] hover:bg-white/5"
              }`}
            >
              <span className="font-medium">מרכז מנכ״ל</span>
            </Link>
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
            <Link
              href="/ceo/ai-operations"
              className={`mr-3 mt-0.5 block rounded-lg px-3 py-1.5 text-xs ${
                pathname.startsWith("/ceo/ai-operations")
                  ? "text-white"
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              מרכז AI
            </Link>
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
                <>
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
                  <Link
                    href="/vermillion/product"
                    className={`mr-3 mt-0.5 block rounded-lg px-3 py-1.5 text-xs ${
                      pathname.startsWith("/vermillion/product")
                        ? "text-white"
                        : "text-[var(--muted)] hover:text-white"
                    }`}
                  >
                    ידע מוצר (חוקים)
                  </Link>
                  <Link
                    href="/vermillion/dev-log"
                    className={`mr-3 mt-0.5 block rounded-lg px-3 py-1.5 text-xs ${
                      pathname.startsWith("/vermillion/dev-log")
                        ? "text-white"
                        : "text-[var(--muted)] hover:text-white"
                    }`}
                  >
                    יומן עבודה
                  </Link>
                </>
              )}
            </div>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-[var(--border)] p-3">
        {showEmployeeAdmin && (
          <>
            <Link
              href="/ceo/approvals"
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                pathname.startsWith("/ceo/approvals")
                  ? "bg-amber-900/40 text-amber-100"
                  : "text-[var(--muted)] hover:bg-white/5"
              }`}
            >
              <span>אישור הרשמות</span>
              {pendingApprovals > 0 && (
                <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] text-white">
                  {pendingApprovals}
                </span>
              )}
            </Link>
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
          </>
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
