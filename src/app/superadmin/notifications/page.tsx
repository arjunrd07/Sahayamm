"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Send, Bell, Users, Building2, CheckCircle2, Megaphone, Inbox } from "lucide-react";
import type { Profile, Organization } from "@/types/database";
import { sendManualNotification } from "./actions";
import { NotificationsScreen } from "@/components/notifications-screen";
import { cn } from "@/lib/utils";

interface SentNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  user_id?: string;
  profiles?: { full_name: string; email: string };
}

type TabKey = "inbox" | "broadcast";

export default function SuperadminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("inbox");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [targetType, setTargetType] = useState<"user" | "organization" | "global">("global");
  const [targetId, setTargetId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("verification_decision");
  const [submitting, setSubmitting] = useState(false);

  const { push } = useToast();
  const supabase = createClient();

  async function loadBroadcastData() {
    setLoading(true);
    const [{ data: profs }, { data: orgs }, { data: notifs }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, role, org_id").order("full_name"),
      supabase.from("organizations").select("*").order("name"),
      supabase
        .from("notifications")
        .select("*, profiles:profiles!notifications_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    if (profs) setProfiles(profs as Profile[]);
    if (orgs) setOrganizations(orgs as Organization[]);
    if (notifs) setHistory(notifs as SentNotification[]);
    setLoading(false);
  }

  useEffect(() => {
    if (activeTab === "broadcast") {
      loadBroadcastData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      push("error", "Notification title and message are required.");
      return;
    }
    if ((targetType === "user" || targetType === "organization") && !targetId) {
      push("error", `Please select a target ${targetType}.`);
      return;
    }

    setSubmitting(true);
    const result = await sendManualNotification({
      targetType,
      targetId,
      title,
      message,
      type,
    });
    setSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", `Notification sent successfully to ${result.count} users!`);
    setTitle("");
    setMessage("");
    loadBroadcastData();
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "inbox", label: "My Notifications", icon: Inbox },
    { key: "broadcast", label: "Broadcast / Send", icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-ink dark:text-white">Notifications Centre</h2>
        <p className="text-sm text-ink-slate">
          View your incoming notifications or broadcast custom notifications to users across the platform.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-surface-border-dark pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-px rounded-t-lg",
                activeTab === tab.key
                  ? "border-signal text-signal bg-signal/5"
                  : "border-transparent text-ink-slate hover:text-ink dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "inbox" && (
        <NotificationsScreen />
      )}

      {activeTab === "broadcast" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Card */}
          <Card className="p-6 lg:col-span-2 border border-slate-200 dark:border-surface-border-dark">
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-ink dark:text-white">Compose Notification</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Target Selection Pills */}
              <div>
                <label className="block text-xs font-bold text-ink-slate uppercase tracking-wider mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetType("global");
                      setTargetId("");
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      targetType === "global"
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-surface-pebble dark:bg-white/5 border-surface-border dark:border-surface-border-dark text-ink-slate hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    <Bell className="h-4 w-4" /> Global Broadcast
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetType("organization");
                      setTargetId("");
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      targetType === "organization"
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-surface-pebble dark:bg-white/5 border-surface-border dark:border-surface-border-dark text-ink-slate hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    <Building2 className="h-4 w-4" /> Specific Org
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetType("user");
                      setTargetId("");
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      targetType === "user"
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-surface-pebble dark:bg-white/5 border-surface-border dark:border-surface-border-dark text-ink-slate hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                  >
                    <Users className="h-4 w-4" /> Specific User
                  </button>
                </div>
              </div>

              {/* Target Dropdown based on type */}
              {targetType === "organization" && (
                <Field label="Select Organization" htmlFor="orgSelect">
                  <select
                    id="orgSelect"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none"
                  >
                    <option value="">-- Choose Target Organization --</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.code})
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {targetType === "user" && (
                <Field label="Select User" htmlFor="userSelect">
                  <select
                    id="userSelect"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none"
                  >
                    <option value="">-- Choose Target User --</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name || p.email} ({p.role})
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {/* Notification Title */}
              <Field label="Notification Title" htmlFor="notifTitle">
                <Input
                  id="notifTitle"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Important System Maintenance Notice"
                />
              </Field>

              {/* Notification Message */}
              <Field label="Notification Message Body" htmlFor="notifMsg">
                <textarea
                  id="notifMsg"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter detailed message content to deliver to recipient notifications list..."
                  className="w-full p-3 rounded-xl bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-signal"
                />
              </Field>

              {/* Notification Category */}
              <Field label="Notification Type / Category" htmlFor="notifType">
                <select
                  id="notifType"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark text-sm focus:outline-none"
                >
                  <option value="verification_decision">System Notice / Decision</option>
                  <option value="loan_approved">Loan Update</option>
                  <option value="agreement_ready">Agreement Notice</option>
                  <option value="repayment_reminder">Repayment Reminder</option>
                </select>
              </Field>

              <Button type="submit" variant="primary" className="w-full py-3.5 font-bold shadow-button" loading={submitting}>
                <Send className="h-4 w-4 mr-2" /> Broadcast Notification
              </Button>
            </form>
          </Card>

          {/* History Feed */}
          <Card className="p-6 border border-slate-200 dark:border-surface-border-dark">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-ink dark:text-white">Recent System Sent Feed</h3>
              <Bell className="h-4 w-4 text-blue-600" />
            </div>

            {loading ? (
              <div className="space-y-3 py-4">
                <div className="h-16 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
                <div className="h-16 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-xs text-ink-slate py-6 text-center">No system notifications sent yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-surface-pebble dark:bg-white/5 border border-surface-border dark:border-surface-border-dark"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-ink dark:text-white truncate">{item.title}</span>
                      <span className="text-[10px] text-ink-slate font-mono">{new Date(item.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-ink-slate dark:text-slate-300 line-clamp-2 mb-2 font-medium">{item.message}</p>
                    <div className="flex items-center justify-between text-[11px] text-ink-slate pt-1.5 border-t border-surface-border dark:border-surface-border-dark/50">
                      <span>Recipient: <strong>{item.profiles?.full_name || item.profiles?.email || "User"}</strong></span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Delivered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
