"use client";

import { useNotifications } from "@/context/notification-context";
import { Button } from "@/components/ui/button";
import { formatDateTime, cn } from "@/lib/utils";
import { Bell, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import type { NotificationType } from "@/types/database";

function getNotificationBadge(type: NotificationType) {
  switch (type) {
    case "loan_requested":
      return {
        icon: Clock,
        bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        label: "Request Submitted",
      };
    case "loan_approved":
      return {
        icon: CheckCircle2,
        bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        label: "Accepted / Approved",
      };
    case "loan_rejected":
      return {
        icon: XCircle,
        bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
        label: "Declined",
      };
    case "repayment_reminder":
    case "loan_overdue":
      return {
        icon: AlertTriangle,
        bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        label: "Agreement Expiring / Due",
      };
    case "agreement_ready":
    case "agreement_signed":
      return {
        icon: FileText,
        bg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
        label: "Agreement Update",
      };
    default:
      return {
        icon: ShieldCheck,
        bg: "bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-surface-border-dark",
        label: "System Update",
      };
  }
}

export function NotificationsScreen() {
  const { notifications, unreadCount, markAllRead } = useNotifications();

  useEffect(() => {
    const t = setTimeout(() => {
      if (unreadCount > 0) markAllRead();
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadCount]);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink dark:text-white">Workspace Notifications</h2>
          <p className="text-xs text-ink-slate mt-0.5">
            Real-time updates on loan requests, approval/decline status, agreement expiry, and verification updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllRead} className="text-xs font-semibold">
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark shadow-card space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-signal flex items-center justify-center mx-auto">
            <Bell className="h-6 w-6" />
          </div>
          <p className="text-base font-bold text-ink dark:text-white">No Workspace Notifications Yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
            Notifications regarding your credit requests, verification decisions, and repayment reminders will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const badge = getNotificationBadge(n.type);
            const Icon = badge.icon;
            return (
              <div
                key={n.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all flex items-start gap-3.5",
                  !n.read
                    ? "bg-white dark:bg-surface-dark border-signal/30 shadow-sm ring-1 ring-signal/10"
                    : "bg-slate-50/70 dark:bg-white/5 border-slate-200 dark:border-surface-border-dark"
                )}
              >
                <div className={cn("p-2.5 rounded-xl border shrink-0 mt-0.5", badge.bg)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={cn("text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border", badge.bg)}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{formatDateTime(n.created_at)}</span>
                  </div>
                  <p className="text-sm font-bold text-ink dark:text-white">{n.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed mt-0.5">{n.message}</p>
                </div>
                {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-signal shrink-0 mt-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
