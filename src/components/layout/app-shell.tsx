"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import type { NavItem } from "@/lib/nav";

export function AppShell({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas dark:bg-canvas-dark">
      <Sidebar items={navItems} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar items={navItems} />
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-5 sm:py-6 pb-20 md:pb-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
      <MobileBottomNav items={navItems} />
    </div>
  );
}
