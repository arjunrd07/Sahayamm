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
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-canvas-dark/90 backdrop-blur-md border-b border-surface-border dark:border-surface-border-dark">
      <div className="flex items-center justify-between px-4 md:px-8 h-16">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden h-11 w-11 flex items-center justify-center rounded-xl text-ink-slate hover:bg-surface-pebble dark:hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-ink dark:text-white tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={notificationsHref}
            className="relative h-11 w-11 rounded-xl flex items-center justify-center text-ink-slate hover:text-ink dark:hover:text-white hover:bg-surface-pebble dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-signal ring-2 ring-white dark:ring-canvas-dark" />
            )}
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink-navy/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-canvas-dark p-6 shadow-elevated">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-lg text-ink dark:text-white">Menu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="p-1 rounded-lg text-ink-slate">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {items.map((item) => {
                const active = pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors",
                      active ? "bg-signal-soft text-signal" : "text-ink-slate hover:bg-surface-pebble"
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
