"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Send,
  Bell,
  Users,
  Building2,
  CheckCircle2,
  Megaphone,
  Inbox,
  Mail,
  User,
  Search,
  Sparkles,
  Clock,
} from "lucide-react";
import type { Profile, Organization } from "@/types/database";
import { getAdminNotificationsData, sendManualNotification } from "./actions";
import { NotificationsScreen } from "@/components/notifications-screen";
import { cn, formatDate } from "@/lib/utils";

interface SentNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  user_id?: string;
  email_sent?: boolean;
  recipient_name?: string;
  recipient_email?: string;
}

type TabKey = "inbox" | "broadcast";

function AdminNotificationsContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("broadcast");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [targetType, setTargetType] = useState<"user" | "organization" | "global">("user");
  const [targetId, setTargetId] = useState<string>("");
  const [userSearch, setUserSearch] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("verification_decision");
  const [sendEmailNotice, setSendEmailNotice] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { push } = useToast();

  async function loadBroadcastData() {
    setLoading(true);
    try {
      const res = await getAdminNotificationsData();
      setProfiles(res.profiles as Profile[]);
      setOrganizations(res.organizations as Organization[]);
      setHistory(res.history as SentNotification[]);

      if (res.profiles.length > 0 && !targetId) {
        setTargetId(res.profiles[0].id);
      }
    } catch (err: any) {
      push("error", err.message || "Failed to load notification directory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBroadcastData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      targetId: targetType === "global" ? undefined : targetId,
      title,
      message,
      type,
      sendEmailNotice,
    });
    setSubmitting(false);

    if ("error" in result && result.error) {
      push("error", result.error);
      return;
    }

    push("success", `Notification and email dispatched to ${result.count} recipient(s)!`);
    setTitle("");
    setMessage("");
    loadBroadcastData();
  }

  const filteredUsers = profiles.filter((p) => {
    const term = userSearch.toLowerCase();
    return (
      !term ||
      p.full_name?.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.pan_number?.toLowerCase().includes(term) ||
      p.role?.toLowerCase().includes(term)
    );
  });

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "broadcast", label: "Broadcast & Dispatch", icon: Megaphone },
    { key: "inbox", label: "My Admin Inbox", icon: Inbox },
  ];

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal/10 text-signal border border-signal/20 text-xs font-semibold mb-2">
            <Bell className="h-3.5 w-3.5" /> Communications Command
          </div>
          <h1 className="text-2xl font-black text-ink dark:text-white tracking-tight">
            Notifications &amp; Email Dispatcher
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dispatch direct messages, account updates, and transactional email alerts to platform members.
          </p>
        </div>

        <Button variant="secondary" onClick={loadBroadcastData} className="rounded-xl text-xs gap-1.5 font-bold self-start sm:self-auto">
          <Sparkles className="h-3.5 w-3.5 text-signal" /> Refresh Directory
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-px rounded-t-lg",
                isActive
                  ? "border-signal text-signal bg-signal/5"
                  : "border-transparent text-slate-500 hover:text-ink dark:hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "inbox" ? (
        <NotificationsScreen />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-base font-extrabold text-ink dark:text-white">Compose Notification</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Targeted announcements and alerts are delivered both in-app and directly to user email inboxes.
                  </p>
                </div>

                {/* Target Scope Selection */}
                <div>
                  <label className="block text-xs font-bold text-ink dark:text-white mb-2 uppercase tracking-wider">
                    Recipient Target Audience
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetType("user");
                        if (profiles.length > 0) setTargetId(profiles[0].id);
                      }}
                      className={cn(
                        "p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all",
                        targetType === "user"
                          ? "border-signal bg-signal/5 text-signal ring-2 ring-signal/20"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <User className="h-4 w-4" />
                      <span className="text-xs font-bold">Specific User</span>
                      <span className="text-[10px] text-slate-400">Direct message</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetType("organization");
                        if (organizations.length > 0) setTargetId(organizations[0].id);
                      }}
                      className={cn(
                        "p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all",
                        targetType === "organization"
                          ? "border-signal bg-signal/5 text-signal ring-2 ring-signal/20"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <Building2 className="h-4 w-4" />
                      <span className="text-xs font-bold">Organization</span>
                      <span className="text-[10px] text-slate-400">All campus users</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetType("global");
                        setTargetId("");
                      }}
                      className={cn(
                        "p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all",
                        targetType === "global"
                          ? "border-signal bg-signal/5 text-signal ring-2 ring-signal/20"
                          : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-bold">Global Platform</span>
                      <span className="text-[10px] text-slate-400">Broadcast to all</span>
                    </button>
                  </div>
                </div>

                {/* Specific User Target Selector */}
                {targetType === "user" && (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <label className="block text-xs font-bold text-ink dark:text-white">
                      Select Target Recipient ({profiles.length} Available Users)
                    </label>

                    <div className="flex items-center gap-2 mb-2">
                      <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Filter by name, email, or role..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-ink dark:text-white focus:outline-none focus:ring-1 focus:ring-signal"
                      />
                    </div>

                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                      className="w-full text-xs py-2.5 px-3 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-bold text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-signal"
                    >
                      {filteredUsers.length === 0 ? (
                        <option value="">No matching users found</option>
                      ) : (
                        filteredUsers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name || "Unnamed User"} ({p.email}) — [{p.role?.toUpperCase() || "BORROWER"}]
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                )}

                {/* Specific Org Target Selector */}
                {targetType === "organization" && (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <label className="block text-xs font-bold text-ink dark:text-white">
                      Select Target Organization
                    </label>
                    <select
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                      className="w-full text-xs py-2.5 px-3 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 font-bold text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-signal"
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Field label="Notification Subject / Title" required>
                  <Input
                    placeholder="e.g. Account Verification Approved / Important Loan Policy Update"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Message Body / Content" required>
                  <textarea
                    rows={4}
                    placeholder="Provide the complete message or instructions for the user..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="w-full text-xs py-2.5 px-3 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-signal resize-none"
                  />
                </Field>

                {/* Instant Email Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl bg-signal/5 border border-signal/20">
                  <input
                    type="checkbox"
                    checked={sendEmailNotice}
                    onChange={(e) => setSendEmailNotice(e.target.checked)}
                    className="h-4 w-4 rounded text-signal focus:ring-signal"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-ink dark:text-white flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-signal" /> Send Instant Transactional Email Notice
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Dispatches a formatted notification email directly to the recipient&apos;s registered inbox.
                    </p>
                  </div>
                </label>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    type="submit"
                    loading={submitting}
                    className="font-bold shadow-button rounded-xl text-xs gap-1.5 px-6"
                  >
                    <Send className="h-4 w-4" /> Dispatch Notification &amp; Email
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Recent Broadcast Log */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-ink dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-signal" /> Recent Notification Dispatches
            </h3>

            {loading ? (
              <div className="space-y-3">
                <div className="h-20 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
                <div className="h-20 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
              </div>
            ) : history.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate-400 space-y-1">
                <Mail className="h-6 w-6 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-500">No broadcasts sent yet</p>
                <p className="text-[11px]">Compose your first alert using the form on the left.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map((n) => (
                  <Card key={n.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-ink dark:text-white text-xs">{n.title}</h4>
                        <p className="text-[11px] text-slate-500">
                          To: <strong>{n.recipient_name || "Platform Member"}</strong> ({n.recipient_email})
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatDate(n.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span className="uppercase font-bold tracking-wider">{n.type}</span>
                      {n.email_sent && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="h-3 w-3" /> Email Dispatched
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 max-w-7xl pb-16">
          <div className="h-24 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="h-64 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        </div>
      }
    >
      <AdminNotificationsContent />
    </Suspense>
  );
}
