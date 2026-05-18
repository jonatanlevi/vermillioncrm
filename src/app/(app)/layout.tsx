import { auth } from "@/auth";
import { AppShell } from "@/components/layout/app-shell";
import { parsePermissions } from "@/lib/auth/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const role = user?.role ?? "EMPLOYEE";
  const permissions = parsePermissions(user?.permissions ?? "{}");
  const isCeo = role === "CEO";

  return (
    <AppShell
      userName={user?.name}
      role={role}
      permissions={permissions}
      showHome={isCeo}
      showCeo={isCeo || Boolean(permissions.ceo)}
      showEmployeeAdmin={isCeo}
    >
      {children}
    </AppShell>
  );
}
