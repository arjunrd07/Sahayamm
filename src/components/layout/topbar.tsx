"use client";

import Link from "next/link";
import { Bell, Menu, X, ArrowRight } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { useNotifications } from "@/context/notification-context";
import { useState, useRef, useEffect } from "react";
import type { NavItem } from "@/lib/nav";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    name: "Profile & KYC Updated",
    description: "Profile identity and financial details stored",
    time: "Just now",
    icon: "🛡️",
    color: "#00C9A7",
  },
  {
    name: "Loan Request Approved",
    description: "₹75,000 credit agreement ready",
    time: "5m ago",
    icon: "💸",
    color: "#1E86FF",
  },
  {
    name: "Agreement Reminder",
    description: "Repayment schedule ready for review",
    time: "15m ago",
    icon: "🗞️",
    color: "#FFB800",
  },
];

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
        "relative mx-auto min-h-fit w-full max-w-[360px] cursor-pointer overflow-hidden rounded-xl p-3",
        "transition-all duration-200 ease-in-out hover:scale-[102%]",
        read ? "bg-slate-50/60 dark:bg-white/5 opacity-80" : "bg-white dark:bg-surface-dark border border-signal/20 dark:border-signal/30 shadow-xs",
        "dark:backdrop-blur-md"
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-xl shadow-xs text-base"
          style={{
            backgroundColor: color,
          }}
        >
          <span>{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden min-w-0 flex-1">
          <figcaption className="flex flex-row items-center justify-between text-xs font-bold text-ink dark:text-white">
            <span className="truncate">{name}</span>
            <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-1">{time}</span>
          </figcaption>
          <p className="text-xs font-medium text-ink-slate truncate mt-0.5">
            {description}
          </p>
        </div>
      </div>
    </figure>
  );
};

export function Topbar({ items }: { items: NavItem[] }) {
  const { notifications, unreadCount } = useNotifications();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pathname = usePathname();
  const popoverRef = useRef<HTMLDivElement>(null);

  const notificationsHref = pathname?.startsWith("/lender") ? "/lender/notifications" : "/borrower/notifications";
  const active = items.find((item) => pathname?.startsWith(item.href));
  const title = active?.label ?? "Sahayam";

  // Map real database notifications to UI format
  const displayNotifications: NotificationItem[] = notifications.length > 0
    ? notifications.slice(0, 10).map((n) => {
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
      })
    : DEFAULT_NOTIFICATIONS;

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

        <div className="flex items-center gap-2 relative" ref={popoverRef}>
          <ThemeToggle />

          {/* Notification Trigger Button */}
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            className={cn(
              "relative h-11 w-11 rounded-xl flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal",
              notifOpen
                ? "bg-signal-soft text-signal"
                : "text-ink-slate hover:text-ink dark:hover:text-white hover:bg-surface-pebble dark:hover:bg-white/5"
            )}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-signal ring-2 ring-white dark:ring-canvas-dark" />
            )}
          </button>

          {/* Animated Notification Dropdown Popover */}
          {notifOpen && (
            <div className="absolute right-0 top-14 w-80 sm:w-96 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark shadow-elevated z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-100 dark:border-surface-border-dark flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-ink dark:text-white">Workspace Notifications</h3>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-600 border border-blue-200">
                      {unreadCount} Unread
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      All Read
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Animated List Container */}
              <div className="p-3 max-h-[380px] overflow-y-auto space-y-2">
                <AnimatedList delay={1000}>
                  {displayNotifications.map((item, idx) => (
                    <NotificationCard key={item.id ?? idx} {...item} />
                  ))}
                </AnimatedList>
              </div>

              <div className="p-3 border-t border-slate-100 dark:border-surface-border-dark bg-slate-50/50 dark:bg-white/5 text-center">
                <Link
                  href={notificationsHref}
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-bold text-signal hover:underline inline-flex items-center gap-1.5"
                >
                  View All Notifications <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
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
