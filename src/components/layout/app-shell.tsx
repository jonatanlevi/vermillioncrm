import { Sidebar, type SidebarNavProps } from "./sidebar";
import { SessionStatusBar } from "./session-status-bar";
import { VermillionSyncProvider } from "./vermillion-sync-poller";

type Props = SidebarNavProps & {
  children: React.ReactNode;
  userEmail?: string | null;
};

export function AppShell(
  props: Props & { pendingApprovals?: number }
) {
  const { children, pendingApprovals, userEmail, ...nav } = props;
  return (
    <div className="flex min-h-screen flex-row-reverse bg-[var(--bg)] text-[var(--text)]">
      <Sidebar {...nav} pendingApprovals={pendingApprovals} userEmail={userEmail} />
      <main className="flex-1 overflow-auto p-6">
        <VermillionSyncProvider>
          <SessionStatusBar
            role={nav.role}
            userName={nav.userName}
            userEmail={userEmail}
          />
          {children}
        </VermillionSyncProvider>
      </main>
    </div>
  );
}
