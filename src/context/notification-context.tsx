"use client";

import { createClient } from "@/lib/supabase/client";
import type { AppNotification } from "@/types/database";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const supabase = createClient();

  async function load() {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to fetch notifications:", error.message);
    }
    const raw = (data as AppNotification[]) || [];
    const sorted = [...raw].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifications(sorted);
  }

  useEffect(() => {
    load();
    if (!profile) return;

    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        (payload) =>
          setNotifications((cur) => {
            const newItem = payload.new as AppNotification;
            const updated = [newItem, ...cur.filter((n) => n.id !== newItem.id)];
            return updated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function markAllRead() {
    if (!profile) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", profile.id).eq("read", false);
    setNotifications((cur) => cur.map((n) => ({ ...n, read: true })));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, refresh: load }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
