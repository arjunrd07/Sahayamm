import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { NavItem } from "@/lib/nav";

export function AppShell({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar items={navItems} />
      <div className="flex-1 min-w-0">
        <Topbar items={navItems} />
        <main className="px-4 md:px-8 py-6 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
