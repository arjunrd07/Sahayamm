"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import type { NavItem } from "@/lib/nav";

import { CommandPalette } from "../ui/command-palette";

export function AppShell({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Restore collapse state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sahayam_sidebar_collapsed");
    if (saved === "true") {
      setCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sahayam_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas dark:bg-canvas-dark">
      <CommandPalette />
      {/* Full Width Topbar across screen top */}
      <Topbar items={navItems} />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar below Topbar on left (no redundant brand header) */}
        <Sidebar items={navItems} collapsed={collapsed} onToggleCollapse={toggleCollapse} />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-8 py-5 sm:py-6 pb-20 md:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      <MobileBottomNav items={navItems} />
    </div>
  );
}
