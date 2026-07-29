"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";
import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/context/notification-context";
import { LogOut, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ items, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col shrink-0 border-r border-slate-200/90 dark:border-surface-border-dark bg-white dark:bg-surface-dark h-[calc(100vh-4rem)] sticky top-16 py-4 shadow-xs z-20 transition-all duration-300 ease-in-out",
        collapsed ? "w-20 px-3" : "w-60 px-4"
      )}
    >
      {/* Sidebar Top Section with Collapse Toggle */}
      <div className={cn("flex items-center mb-4 pb-3 border-b border-slate-100 dark:border-white/5", collapsed ? "justify-center" : "justify-between px-2")}>
        {!collapsed ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </span>
        ) : null}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 text-slate-400 hover:text-ink dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-0.5">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          const isNotif = item.label.toLowerCase().includes("notification");

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center rounded-xl py-2.5 text-xs font-bold transition-all min-h-[42px] group",
                collapsed ? "justify-center px-0" : "justify-between px-3.5",
                active
                  ? "bg-signal/10 text-signal dark:bg-signal/20 dark:text-blue-300 border border-signal/20 shadow-xs font-extrabold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-ink dark:hover:text-white"
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-signal rounded-r-full shadow-xs" />
              )}
              
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform group-hover:scale-110 shrink-0",
                    active
                      ? "text-signal dark:text-blue-300 stroke-[2.5]"
                      : "text-slate-400 dark:text-slate-400"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {/* Notification Badges */}
              {isNotif && unreadCount > 0 && (
                collapsed ? (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-signal ring-2 ring-white dark:ring-surface-dark" />
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-signal text-white shadow-xs animate-in zoom-in-50">
                    {unreadCount}
                  </span>
                )
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Card */}
      {profile && (
        <div className="border-t border-slate-100 dark:border-surface-border-dark pt-3 mt-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-9 w-9 rounded-full bg-gradient-to-tr from-signal/20 to-blue-500/20 text-signal dark:text-blue-300 border border-signal/30 flex items-center justify-center text-xs font-extrabold shadow-xs"
                title={profile.full_name}
              >
                {initials(profile.full_name)}
              </div>
              <button
                onClick={signOut}
                className="text-slate-400 hover:text-danger p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-2xl bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <div className="relative shrink-0">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-signal/20 to-blue-500/20 text-signal dark:text-blue-300 border border-signal/30 flex items-center justify-center text-xs font-extrabold shadow-xs">
                  {initials(profile.full_name)}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-surface-dark" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-ink dark:text-white truncate">{profile.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 capitalize">
                    <ShieldCheck className="h-3 w-3 text-signal" />
                    {profile.role}
                  </span>
                </div>
              </div>

              <button
                onClick={signOut}
                className="text-slate-400 hover:text-danger p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
