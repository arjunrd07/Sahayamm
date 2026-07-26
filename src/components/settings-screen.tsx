"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "@/context/theme-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { 
  Moon, 
  Sun, 
  Bell, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  Lock, 
  UserCheck, 
  KeyRound, 
  Check, 
  LogOut,
  Smartphone,
  Globe,
  Sliders
} from "lucide-react";

export function SettingsScreen() {
  const { theme, toggle } = useTheme();
  const { profile, signOut } = useAuth();
  const { push } = useToast();

  const [activeTab, setActiveTab] = useState<"appearance" | "notifications" | "security" | "banking" | "organization">("appearance");

  // Notifications State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [disbursalAlerts, setDisbursalAlerts] = useState(true);
  const [dueDateReminders, setDueDateReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Banking State
  const [bankName, setBankName] = useState("HDFC Bank");
  const [accountNumber, setAccountNumber] = useState("50100492810492");
  const [ifscCode, setIfscCode] = useState("HDFC0001234");
  const [upiId, setUpiId] = useState(`${profile?.full_name?.toLowerCase().replace(/\s+/g, "") || "user"}@upi`);

  // Security State
  const [twoFactor, setTwoFactor] = useState(false);
  const [savedBanking, setSavedBanking] = useState(false);

  const handleSaveBanking = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedBanking(true);
    push("success", "Disbursal banking details updated successfully.");
    setTimeout(() => setSavedBanking(false), 3000);
  };

  const isStaff = profile?.role === "admin" || profile?.role === "superadmin";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-ink dark:text-white tracking-tight">Account & Workspace Settings</h2>
        <p className="text-sm text-ink-slate dark:text-slate-400 mt-1">
          Manage your personal preferences, notification triggers, disbursal bank accounts, and security controls.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-surface-border-dark pb-3">
        {[
          { id: "appearance", label: "Appearance", icon: theme === "light" ? Sun : Moon },
          { id: "notifications", label: "Notifications", icon: Bell },
          { id: "security", label: "Security & 2FA", icon: Lock },
          { id: "banking", label: "Banking & Disbursal", icon: CreditCard },
          ...(isStaff ? [{ id: "organization", label: "Org Policy", icon: Building2 }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                isActive
                  ? "bg-signal text-white border-signal shadow-sm"
                  : "bg-white dark:bg-surface-dark text-ink dark:text-white border-slate-200 dark:border-surface-border-dark hover:border-signal/40"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPEARANCE */}
      {activeTab === "appearance" && (
        <Card className="space-y-6 p-6 sm:p-8">
          <div>
            <CardTitle className="text-lg font-extrabold">Theme Preference</CardTitle>
            <CardDescription className="text-xs text-ink-slate dark:text-slate-400 mt-1">
              Select your preferred UI appearance. Sahayam supports clean Light mode and Pitch Black Dark mode.
            </CardDescription>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Light Mode Card */}
            <div
              onClick={() => theme === "dark" && toggle()}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                theme === "light"
                  ? "border-signal bg-signal-soft/40 shadow-sm"
                  : "border-slate-200 dark:border-surface-border-dark bg-slate-50 dark:bg-surface-dark opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <span className="font-extrabold text-sm text-ink dark:text-white">Light Mode</span>
                </div>
                {theme === "light" && <Check className="h-4 w-4 text-signal" />}
              </div>
              <p className="text-xs text-ink-slate">High contrast daylight theme with crisp slate borders and clean backgrounds.</p>
            </div>

            {/* Pitch Black Dark Mode Card */}
            <div
              onClick={() => theme === "light" && toggle()}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                theme === "dark"
                  ? "border-signal bg-black shadow-sm"
                  : "border-slate-200 dark:border-surface-border-dark bg-slate-50 dark:bg-surface-dark opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-signal" />
                  <span className="font-extrabold text-sm text-ink dark:text-white">Pitch Black Dark Mode</span>
                </div>
                {theme === "dark" && <Check className="h-4 w-4 text-signal" />}
              </div>
              <p className="text-xs text-slate-400">Pure OLED black canvas with obsidian surface highlights and zero glare.</p>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 2: NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <Card className="space-y-6 p-6 sm:p-8">
          <div>
            <CardTitle className="text-lg font-extrabold">Transactional Alerts & Reminders</CardTitle>
            <CardDescription className="text-xs text-ink-slate dark:text-slate-400 mt-1">
              Configure real-time automated email notifications sent via Resend API integration.
            </CardDescription>
          </div>

          <div className="space-y-4">
            <ToggleRow
              title="Loan Disbursal & Approval Alerts"
              description="Receive instant emails when your loan application is approved by org admins or disbursed."
              checked={disbursalAlerts}
              onChange={() => setDisbursalAlerts(!disbursalAlerts)}
            />
            <ToggleRow
              title="Repayment Due Date Reminders"
              description="Automated 3-day and 1-day reminders before your loan repayment due date."
              checked={dueDateReminders}
              onChange={() => setDueDateReminders(!dueDateReminders)}
            />
            <ToggleRow
              title="DocuSeal E-Signature Requests"
              description="Get notified when a new loan agreement requires your legal e-signature."
              checked={emailNotifications}
              onChange={() => setEmailNotifications(!emailNotifications)}
            />
            <ToggleRow
              title="Platform Digest & Updates"
              description="Occasional updates about new intra-organization credit limits and policy changes."
              checked={marketingEmails}
              onChange={() => setMarketingEmails(!marketingEmails)}
            />
          </div>

          <div className="pt-2">
            <Button variant="primary" onClick={() => push("success", "Notification preferences saved.")}>
              Save Notification Settings
            </Button>
          </div>
        </Card>
      )}

      {/* TAB 3: SECURITY */}
      {activeTab === "security" && (
        <Card className="space-y-6 p-6 sm:p-8">
          <div>
            <CardTitle className="text-lg font-extrabold">Security & Session Management</CardTitle>
            <CardDescription className="text-xs text-ink-slate dark:text-slate-400 mt-1">
              Protected by Supabase Row Level Security (RLS) and encrypted database tokens.
            </CardDescription>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-ink dark:text-white">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-ink-slate dark:text-slate-400 mt-0.5">Require an authenticator code during login.</p>
              </div>
              <Button
                variant={twoFactor ? "primary" : "secondary"}
                onClick={() => {
                  setTwoFactor(!twoFactor);
                  push("info", twoFactor ? "2FA Disabled" : "2FA Verification Enabled for your account.");
                }}
              >
                {twoFactor ? "Enabled" : "Enable 2FA"}
              </Button>
            </div>

            {/* Active Sessions */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark space-y-3">
              <p className="text-sm font-extrabold text-ink dark:text-white">Active Sessions</p>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-signal" />
                  <span className="font-semibold text-ink dark:text-white">Chrome on Windows (Current Session)</span>
                </div>
                <span className="text-emerald-600 font-extrabold">Active Now</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-surface-border-dark flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-slate">Account: {profile?.email}</span>
            <Button variant="danger" onClick={signOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>Sign out of workspace</span>
            </Button>
          </div>
        </Card>
      )}

      {/* TAB 4: BANKING & DISBURSAL */}
      {activeTab === "banking" && (
        <Card className="space-y-6 p-6 sm:p-8">
          <div>
            <CardTitle className="text-lg font-extrabold">Disbursal & Repayment Bank Details</CardTitle>
            <CardDescription className="text-xs text-ink-slate dark:text-slate-400 mt-1">
              Your registered bank account for receiving offline loan disbursals and verifying UTR repayment receipts.
            </CardDescription>
          </div>

          <form onSubmit={handleSaveBanking} className="space-y-4 max-w-xl">
            <Field label="Bank Name" htmlFor="bank-name">
              <Input
                id="bank-name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank / ICICI Bank"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Account Number" htmlFor="acc-num">
                <Input
                  id="acc-num"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account Number"
                />
              </Field>
              <Field label="IFSC Code" htmlFor="ifsc">
                <Input
                  id="ifsc"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="HDFC0001234"
                />
              </Field>
            </div>

            <Field label="UPI Virtual Payment Address (VPA)" htmlFor="upi">
              <Input
                id="upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="user@upi"
              />
            </Field>

            <Button type="submit" variant="primary" className="mt-2">
              {savedBanking ? "Saved!" : "Save Banking Details"}
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 5: ORGANIZATION POLICY (Admin/Staff Only) */}
      {activeTab === "organization" && isStaff && (
        <Card className="space-y-6 p-6 sm:p-8">
          <div>
            <CardTitle className="text-lg font-extrabold">Organization Credit Policy & Limits</CardTitle>
            <CardDescription className="text-xs text-ink-slate dark:text-slate-400 mt-1">
              Configure intra-organization lending caps, interest rules, and approval escalation triggers.
            </CardDescription>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-ink-slate">Max Per-Employee Limit</span>
              <p className="text-xl font-black text-ink dark:text-white">₹2,00,000</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-ink-slate">Default Interest Rate</span>
              <p className="text-xl font-black text-emerald-600">0% (Intra-Org)</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-ink-slate">DocuSeal Template</span>
              <p className="text-sm font-bold text-signal">SHM-AGREEMENT-V2</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-200/90 dark:border-surface-border-dark">
      <div className="space-y-0.5">
        <p className="text-sm font-extrabold text-ink dark:text-white">{title}</p>
        <p className="text-xs text-ink-slate dark:text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
          checked ? "bg-signal" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
