import { Sidebar, type SidebarNavProps } from "./sidebar";

type Props = SidebarNavProps & {
  children: React.ReactNode;
};

export function AppShell(props: Props) {
  const { children, ...nav } = props;
  return (
    <div className="flex min-h-screen flex-row-reverse bg-[var(--bg)] text-[var(--text)]">
      <Sidebar {...nav} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
