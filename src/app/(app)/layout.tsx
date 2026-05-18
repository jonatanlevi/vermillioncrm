import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { parsePermissions } from "@/lib/auth/permissions";
import { listPendingSignups } from "@/lib/ceo/signup-approvals";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const role = user?.role ?? "EMPLOYEE";
  const permissions = parsePermissions(user?.permissions ?? "{}");
  const isCeo = role === "CEO";
  const pendingApprovals = isCeo ? (await listPendingSignups()).length : 0;

  return (
    <AppShell
      userName={user?.name}
      userEmail={user?.email}
      role={role}
      permissions={permissions}
      showHome={isCeo}
      showCeo={isCeo || Boolean(permissions.ceo)}
      showEmployeeAdmin={isCeo}
      pendingApprovals={pendingApprovals}
    >
      {children}
    </AppShell>
  );
}
