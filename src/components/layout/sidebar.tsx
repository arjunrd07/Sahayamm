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
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-slate-200/90 dark:border-surface-border-dark bg-white/95 dark:bg-canvas-dark/95 backdrop-blur-md h-screen sticky top-0 px-4 py-6 shadow-sm">
      <Link href="/" className="flex items-center gap-3 px-3 mb-8 group">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-signal to-blue-500 flex items-center justify-center shadow-button transition-transform group-hover:scale-105">
          <span className="text-white text-base font-black">S</span>
        </div>
        <div>
          <span className="font-extrabold text-xl text-ink dark:text-white tracking-tight">Sahayam</span>
          <p className="text-[10px] font-bold text-signal uppercase tracking-wider -mt-1">FinTech Platform</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-1.5">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 min-h-[44px]",
                active
                  ? "bg-signal-soft text-signal dark:bg-white/10 dark:text-white font-bold shadow-sm"
                  : "text-ink-slate hover:bg-surface-pebble dark:hover:bg-white/5 hover:text-ink dark:hover:text-white"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 transition-colors", active ? "text-signal dark:text-white stroke-[2.5]" : "text-ink-mist")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {profile && (
        <div className="border-t border-slate-200/80 dark:border-surface-border-dark pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-9 w-9 rounded-full bg-signal-soft text-signal-cobalt border border-signal/20 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
              {initials(profile.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink dark:text-white truncate">{profile.full_name}</p>
              <p className="text-[11px] text-ink-slate dark:text-ink-mist truncate capitalize font-medium">{profile.role}</p>
            </div>
            <button
              onClick={signOut}
              className="text-ink-slate hover:text-danger p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
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


