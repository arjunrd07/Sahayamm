"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";
import { useAuth } from "@/context/auth-context";
import { LogOut } from "lucide-react";

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-surface-border dark:border-surface-border-dark bg-white dark:bg-canvas-dark h-screen sticky top-0 px-4 py-6">
      <Link href="/" className="flex items-center gap-2.5 px-3 mb-8">
        <div className="h-8 w-8 rounded-lg bg-signal flex items-center justify-center shadow-button">
          <span className="text-white text-base font-bold">S</span>
        </div>
        <span className="font-bold text-xl text-ink dark:text-white tracking-tight">Sahayam</span>
      </Link>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-150",
                active
                  ? "bg-signal-soft text-signal dark:bg-white/10 dark:text-white"
                  : "text-ink-slate hover:bg-surface-pebble dark:hover:bg-white/5 hover:text-ink dark:hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-signal dark:text-white" : "text-ink-mist")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {profile && (
        <div className="border-t border-surface-border dark:border-surface-border-dark pt-4 mt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-signal-soft text-signal-cobalt flex items-center justify-center text-xs font-bold shrink-0">
              {initials(profile.full_name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink dark:text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-ink-slate dark:text-ink-mist truncate capitalize">{profile.role}</p>
            </div>
            <button
              onClick={signOut}
              className="ml-auto text-ink-slate hover:text-danger p-2 rounded-lg hover:bg-surface-pebble transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
