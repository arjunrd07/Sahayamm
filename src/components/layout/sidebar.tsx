"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";
import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/context/notification-context";
import {
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";

interface SidebarProps {
  items: NavItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ items, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();

  // Track expanded state for items with sub-items
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.items) {
        // Automatically expand if current path matches any sub-item
        const isChildActive = item.items.some((sub) => pathname?.startsWith(sub.href));
        initial[item.label] = isChildActive || true;
      }
    });
    return initial;
  });

  const toggleItemOpen = (label: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col shrink-0 border-r border-slate-200/60 dark:border-white/10 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl h-[calc(100vh-4rem)] sticky top-16 py-4 px-3.5 shadow-xs transition-all duration-300 ease-in-out z-30 selection:bg-primary/20",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Sidebar Header with Workspace Label & Collapse Toggle */}
      <div
        className={cn(
          "flex items-center mb-3 pb-3 border-b border-slate-100 dark:border-white/5",
          collapsed ? "justify-center" : "justify-between px-2"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-white text-xs font-black shadow-xs">
              S
            </div>
            <span className="text-xs font-extrabold tracking-tight text-ink dark:text-white uppercase">
              Sahayam Workspace
            </span>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/10 text-slate-400 hover:text-ink dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/10 transition-all active:scale-95"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar pr-0.5">
        {items.map((item) => {
          const hasSubItems = Boolean(item.items && item.items.length > 0);
          const isOpen = Boolean(openItems[item.label]);
          const Icon = item.icon;
          const isNotif = item.label.toLowerCase().includes("notification");
          const isParentActive =
            pathname === item.href ||
            (hasSubItems && item.items?.some((sub) => pathname === sub.href));

          if (hasSubItems && !collapsed) {
            return (
              <div key={item.label} className="space-y-1">
                {/* Collapsible Trigger Header */}
                <button
                  onClick={() => toggleItemOpen(item.label)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-bold transition-all min-h-[42px] group text-left",
                    isParentActive
                      ? "bg-primary/10 text-primary dark:text-blue-300 font-extrabold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-ink dark:hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-bold tracking-tight">{item.label}</span>
                  </div>
                  <div className="p-1 rounded-md text-slate-400 group-hover:text-ink dark:group-hover:text-white">
                    {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </div>
                </button>

                {/* Collapsible Sub-Items */}
                {isOpen && (
                  <div className="ml-4 pl-3 border-l border-slate-200/80 dark:border-white/10 space-y-1 py-0.5 animate-in fade-in duration-200">
                    {item.items?.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      const SubIcon = sub.icon;

                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold transition-all min-h-[36px]",
                            isSubActive
                              ? "bg-primary text-white font-extrabold shadow-button shadow-primary/25"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-ink dark:hover:text-white"
                          )}
                        >
                          {SubIcon && <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />}
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Single Link Navigation Item
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center rounded-lg py-2.5 text-xs font-bold transition-all min-h-[42px] group",
                collapsed ? "justify-center px-0" : "justify-between px-3",
                active
                  ? "bg-primary text-white shadow-button shadow-primary/25 font-black scale-[1.01]"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-ink dark:hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform group-hover:scale-110 shrink-0",
                    active ? "text-white stroke-[2.5]" : "text-slate-400 dark:text-slate-400"
                  )}
                />
                {!collapsed && <span className="text-xs font-semibold tracking-tight">{item.label}</span>}
              </div>

              {/* Notification Badge */}
              {isNotif && unreadCount > 0 && (
                collapsed ? (
                  <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-surface-dark" />
                ) : (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-black rounded-full shadow-xs animate-in zoom-in-50",
                      active ? "bg-white text-primary" : "bg-primary text-white"
                    )}
                  >
                    {unreadCount}
                  </span>
                )
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile Card */}
      {profile && (
        <div className="border-t border-slate-100 dark:border-white/10 pt-3 mt-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary/20 to-blue-500/20 text-primary dark:text-blue-300 border border-primary/30 flex items-center justify-center text-xs font-extrabold shadow-xs"
                title={profile.full_name}
              >
                {initials(profile.full_name)}
              </div>
              <button
                onClick={signOut}
                className="text-slate-400 hover:text-danger p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 shadow-xs">
              <div className="relative shrink-0">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-primary/20 to-blue-500/20 text-primary dark:text-blue-300 border border-primary/30 flex items-center justify-center text-xs font-extrabold shadow-xs">
                  {initials(profile.full_name)}
                </div>
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-surface-dark" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold text-ink dark:text-white truncate">{profile.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 capitalize">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    {profile.role}
                  </span>
                </div>
              </div>

              <button
                onClick={signOut}
                className="text-slate-400 hover:text-danger p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
