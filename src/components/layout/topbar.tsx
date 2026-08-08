"use client";

import Link from "next/link";
import { Bell, Menu, X, ArrowRight, CheckCheck, ChevronRight, Search } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useNotifications } from "@/context/notification-context";
import { useAuth } from "@/context/auth-context";
import { useState, useRef, useEffect } from "react";
import type { NavItem } from "@/lib/nav";
import { usePathname } from "next/navigation";
import { cn, initials } from "@/lib/utils";
import { AnimatedList } from "@/components/ui/animated-list";
import { formatDistanceToNow } from "date-fns";

interface NotificationItem {
  id?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
  read?: boolean;
}

function getNotificationIconAndColor(type: string) {
  switch (type) {
    case "verification_decision":
      return { icon: "🛡️", color: "#00C9A7" };
    case "loan_approved":
    case "funds_sent":
      return { icon: "💸", color: "#1E86FF" };
    case "loan_requested":
      return { icon: "📋", color: "#FF3D71" };
    case "repayment_reminder":
    case "loan_overdue":
      return { icon: "🗞️", color: "#FFB800" };
    default:
      return { icon: "🔔", color: "#6366F1" };
  }
}

const NotificationCard = ({ name, description, icon, color, time, read }: NotificationItem) => {
  return (
    <figure
      className={cn(
        "relative mx-auto min-h-fit w-full cursor-pointer overflow-hidden rounded-xl p-3",
        "transition-all duration-200 ease-in-out hover:scale-[101%]",
        read
          ? "bg-slate-50/60 dark:bg-white/5 opacity-80"
          : "bg-white dark:bg-surface-dark border border-signal/20 dark:border-signal/30 shadow-xs",
        "dark:backdrop-blur-md"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-xl shadow-xs text-sm"
          style={{ backgroundColor: color }}
        >
          <span>{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden min-w-0 flex-1">
          <figcaption className="flex flex-row items-center justify-between text-xs font-bold text-ink dark:text-white">
            <span className="truncate">{name}</span>
            <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-1">{time}</span>
          </figcaption>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

interface TopbarProps {
  items: NavItem[];
}

export function Topbar({ items }: TopbarProps) {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();
  const popoverRef = useRef<HTMLDivElement>(null);

  const isLender = pathname?.startsWith("/lender");
  const isSuperadmin = pathname?.startsWith("/superadmin");
  const portalLabel = isSuperadmin ? "Admin Portal" : isLender ? "Lender Portal" : "Borrower Portal";

  const notificationsHref = isSuperadmin
    ? "/superadmin/notifications"
    : isLender
      ? "/lender/notifications"
      : "/borrower/notifications";
  const active = items.find((item) => pathname?.startsWith(item.href));
  const title = active?.label ?? "Sahayam";

  // Map real database notifications to UI format
  const displayNotifications: NotificationItem[] = notifications.slice(0, 8).map((n) => {
    const { icon, color } = getNotificationIconAndColor(n.type);
    return {
      id: n.id,
      name: n.title,
      description: n.message,
      icon,
      color,
      time: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
      read: n.read,
    };
  });

  // Dismiss dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-slate-200/80 dark:border-surface-border-dark transition-colors duration-200">
      <div className="flex items-center justify-between px-4 md:px-6 h-16 w-full">
        {/* Left Section: Brand Logo & Page Title Breadcrumbs */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Mobile Menu Trigger */}
          <button
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Full-width Topbar Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-signal via-blue-600 to-indigo-700 flex items-center justify-center shadow-button transition-transform group-hover:scale-105 shrink-0">
              <span className="text-white text-base font-black tracking-tighter">S</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-black text-lg text-ink dark:text-white tracking-tight">Sahayam</span>
              </div>
              <p className="text-[9px] font-extrabold text-signal dark:text-blue-400 uppercase tracking-widest -mt-1">
                FinTech Platform
              </p>
            </div>
          </Link>

          <div className="h-5 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />

          {/* Breadcrumbs & Page Title */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span>{portalLabel}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-lg md:text-xl font-black text-ink dark:text-white tracking-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Right Section: Command Palette Trigger, Theme Toggle & Notification Popover */}
        <div className="flex items-center gap-3 relative" ref={popoverRef}>
          {/* Command Palette Trigger Button */}
          <button
            type="button"
            onClick={() => {
              const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
              window.dispatchEvent(event);
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
              Ctrl K
            </kbd>
          </button>

          <ThemeToggle />

          {/* Notification Trigger Button */}
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            className={cn(
              "relative h-10 w-10 rounded-xl flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal active:scale-95 border border-slate-200/60 dark:border-white/10",
              notifOpen
                ? "bg-signal/10 text-signal border-signal/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
            )}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-signal ring-2 ring-white dark:ring-surface-dark animate-pulse" />
            )}
          </button>

          {/* Animated Glass Notification Dropdown Popover */}
          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-2xl bg-white/95 dark:bg-surface-dark/95 backdrop-blur-2xl border border-slate-200 dark:border-surface-border-dark shadow-elevated z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-surface-border-dark flex items-center justify-between bg-slate-50/60 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-ink dark:text-white">Notifications</h3>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-signal/10 text-signal border border-signal/20">
                      {unreadCount} New
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      All Read
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead()}
                      className="text-[11px] font-semibold text-slate-500 hover:text-signal transition-colors inline-flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Read All
                    </button>
                  )}
                  <button
                    onClick={() => setNotifOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notification Items List */}
              <div className="p-3 max-h-[380px] overflow-y-auto space-y-2">
                {displayNotifications.length > 0 ? (
                  <AnimatedList delay={1000}>
                    {displayNotifications.map((item, idx) => (
                      <NotificationCard key={item.id ?? idx} {...item} />
                    ))}
                  </AnimatedList>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 font-medium">
                    No notifications yet
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-100 dark:border-surface-border-dark bg-slate-50/50 dark:bg-white/5 text-center">
                <Link
                  href={notificationsHref}
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-bold text-signal hover:underline inline-flex items-center gap-1.5"
                >
                  View Notification History <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-surface-dark p-6 shadow-elevated flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-signal flex items-center justify-center text-white font-black text-sm">
                    S
                  </div>
                  <span className="font-extrabold text-base text-ink dark:text-white">Sahayam</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close menu"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
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
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-colors",
                        active
                          ? "bg-signal/10 text-signal dark:bg-signal/20 dark:text-blue-300 font-extrabold"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile User Profile Footer */}
            {profile && (
              <div className="border-t border-slate-100 dark:border-white/10 pt-4 mt-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-signal/10 text-signal flex items-center justify-center text-xs font-bold shrink-0">
                      {initials(profile.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink dark:text-white truncate">
                        {profile.full_name}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize font-medium">
                        {profile.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={signOut}
                    className="p-2 text-slate-400 hover:text-danger rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
