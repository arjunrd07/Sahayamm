"use client";

import { useNotifications } from "@/context/notification-context";
import { EmptyState } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDateTime, cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useEffect } from "react";

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
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notifications</h2>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="No notifications yet" description="Updates on your loans and verification will show up here." />
      ) : (
        <div className="card divide-y divide-surface-border dark:divide-surface-border-dark">
          {notifications.map((n) => (
            <div key={n.id} className={cn("flex gap-3 p-4", !n.read && "bg-accent-soft/40")}>
              <div className="h-8 w-8 rounded-full bg-surface dark:bg-white/10 flex items-center justify-center shrink-0">
                <Bell className="h-4 w-4 text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-muted mt-0.5">{n.message}</p>
                <p className="text-xs text-muted mt-1">{formatDateTime(n.created_at)}</p>
              </div>
              {!n.read && <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
