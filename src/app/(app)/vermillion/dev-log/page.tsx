import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Commit = { hash: string; message: string };

function parseArr(raw: string): string[] {
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}
function parseCommits(raw: string): Commit[] {
  try { return JSON.parse(raw) as Commit[]; } catch { return []; }
}

export default async function DevLogPage() {
  const logs = await db.devLog.findMany({
    orderBy: { date: "desc" },
    take: 60,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">יומן עבודה יומי</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            נשלח אוטומטית בכל deploy — commits, קבצים, TODOs
          </p>
        </div>
        <Link
          href="/vermillion"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          ← מוצר VerMillion
        </Link>
      </header>

      {logs.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--muted)]">
          אין יומנים עדיין. הרץ <code className="rounded bg-black/30 px-1">node scripts/daily-log.js</code> או עשה deploy.
        </div>
      )}

      <div className="space-y-4">
        {logs.map((log) => {
          const commits     = parseCommits(log.commits);
          const files       = parseArr(log.filesChanged);
          const todos       = parseArr(log.todos);
          const recentDone  = parseArr(log.recentDone);

          return (
            <article
              key={log.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{log.date}</span>
                  {log.version && (
                    <span className="rounded-full bg-[var(--accent-dim)] px-2 py-0.5 text-xs text-[var(--accent)]">
                      v{log.version}
                    </span>
                  )}
                  <span className="text-xs text-[var(--muted)]">{log.project}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span>{commits.length} commits</span>
                  <span>{files.length} קבצים</span>
                  {log.deployUrl && (
                    <a
                      href={log.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline"
                    >
                      🔗 deploy
                    </a>
                  )}
                </div>
              </div>

              {/* Commits */}
              {commits.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    Commits
                  </h3>
                  <ul className="space-y-1">
                    {commits.map((c) => (
                      <li key={c.hash} className="flex gap-2 text-sm">
                        <code className="shrink-0 text-[var(--muted)] text-xs mt-0.5">{c.hash}</code>
                        <span>{c.message}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Files changed */}
              {files.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    קבצים שהשתנו ({files.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {files.map((f) => (
                      <span
                        key={f}
                        className="rounded bg-black/30 px-2 py-0.5 font-mono text-xs text-[var(--muted)]"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Recently done */}
              {recentDone.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    הושלם לאחרונה
                  </h3>
                  <ul className="space-y-0.5">
                    {recentDone.map((d, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-green-400">
                        <span className="mt-0.5 shrink-0">✅</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* TODOs */}
              {todos.length > 0 && (
                <section>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    עדיין צריך ({todos.length})
                  </h3>
                  <ul className="space-y-0.5">
                    {todos.map((t, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-amber-400">
                        <span className="mt-0.5 shrink-0">⏳</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
