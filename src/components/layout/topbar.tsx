"use client";

import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useNotifications } from "@/context/notification-context";
import { useState } from "react";
import type { NavItem } from "@/lib/nav";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Topbar({ items }: { items: NavItem[] }) {
  const { unreadCount } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const notificationsHref = pathname?.startsWith("/admin") ? "/admin/notifications" : "/customer/notifications";
  const active = items.find((item) => pathname?.startsWith(item.href));
  const title = active?.label ?? "Sahayam";

  return (
    <header className="sticky top-0 z-30 bg-canvas/80 dark:bg-canvas-dark/80 backdrop-blur border-b border-surface-border dark:border-surface-border-dark">
      <div className="flex items-center justify-between px-4 md:px-8 h-16">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden h-9 w-9 flex items-center justify-center rounded-xl text-muted hover:bg-surface dark:hover:bg-white/5"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href={notificationsHref}
            className="relative h-9 w-9 rounded-xl flex items-center justify-center text-muted hover:text-ink dark:hover:text-white hover:bg-surface dark:hover:bg-white/5"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
            )}
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-canvas dark:bg-canvas-dark p-4">
            <div className="flex justify-end mb-4">
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-0.5">
              {items.map((item) => {
                const active = pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                      active ? "bg-surface dark:bg-white/10" : "text-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
