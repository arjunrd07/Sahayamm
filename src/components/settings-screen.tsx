"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "@/context/theme-context";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Tabs } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  Sliders,
  Shield,
  Sun,
  Moon,
  LogOut,
  Save,
  User,
  Lock,
  Download,
  Smartphone,
  Check,
  ArrowRight,
  Landmark,
  CreditCard,
} from "lucide-react";

interface SettingsScreenProps {
  role?: "borrower" | "lender" | "superadmin";
}

type TabValue = "policy" | "bank" | "notifications" | "appearance" | "security";

export function SettingsScreen({ role: forcedRole }: SettingsScreenProps) {
  const { theme, toggle } = useTheme();
  const { profile, signOut, refresh } = useAuth();
  const { push } = useToast();
  const supabase = createClient();

  const userRole = forcedRole || profile?.role || "borrower";
  const isLender = userRole === "lender" || userRole === "superadmin";
  const profileHref = isLender ? "/lender/profile" : "/borrower/profile";

  const [activeTab, setActiveTab] = useState<TabValue>(isLender ? "policy" : "bank");
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Lender Policy Form State
  const [maxLoanLimit, setMaxLoanLimit] = useState("2500000");
  const [annualInterestRate, setAnnualInterestRate] = useState("0.0");
  const [autoApproveThreshold, setAutoApproveThreshold] = useState("15000");
  const [requireDigitalSignatures, setRequireDigitalSignatures] = useState(true);
  const [requireHrmsVerification, setRequireHrmsVerification] = useState(true);

  // Bank & Payout Preferences State
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  // Notification Preferences State
  const [emailLoanUpdates, setEmailLoanUpdates] = useState(true);
  const [emailRepaymentReminders, setEmailRepaymentReminders] = useState(true);
  const [inAppToasts, setInAppToasts] = useState(true);
  const [monthlyStatement, setMonthlyStatement] = useState(false);

  // Security State
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Initialize from Profile & LocalStorage
  useEffect(() => {
    if (!profile) return;

    setBankName(profile.bank_name || "");
    setAccountNumber(profile.account_number || "");
    setIfscCode(profile.ifsc_code || "");
    setUpiId(profile.upi_id || "");

    // Load org capital limit if lender
    if (isLender && profile.org_id) {
      supabase
        .from("organizations")
        .select("capital_pool_limit")
        .eq("id", profile.org_id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.capital_pool_limit) {
            setMaxLoanLimit(String(data.capital_pool_limit));
          }
        });
    }

    // Load local preferences snapshot
    try {
      const stored = localStorage.getItem(`sahayam_prefs_${profile.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed.emailLoanUpdates === "boolean") setEmailLoanUpdates(parsed.emailLoanUpdates);
        if (typeof parsed.emailRepaymentReminders === "boolean") setEmailRepaymentReminders(parsed.emailRepaymentReminders);
        if (typeof parsed.inAppToasts === "boolean") setInAppToasts(parsed.inAppToasts);
        if (typeof parsed.monthlyStatement === "boolean") setMonthlyStatement(parsed.monthlyStatement);
        if (typeof parsed.twoFactorAuth === "boolean") setTwoFactorAuth(parsed.twoFactorAuth);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function persistPreferences(key: string, val: boolean) {
    if (!profile) return;
    try {
      const current = {
        emailLoanUpdates,
        emailRepaymentReminders,
        inAppToasts,
        monthlyStatement,
        twoFactorAuth,
        [key]: val,
      };
      localStorage.setItem(`sahayam_prefs_${profile.id}`, JSON.stringify(current));
    } catch {}
  }

  // Tabs Configuration based on Role
  const tabs = [
    ...(isLender ? [{ value: "policy" as TabValue, label: "Lending Policies" }] : []),
    { value: "bank" as TabValue, label: "UPI & Payment Details" },
    { value: "notifications" as TabValue, label: "Notifications" },
    { value: "appearance" as TabValue, label: "Appearance" },
    { value: "security" as TabValue, label: "Security & Account" },
  ];

  async function handleSaveBankDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSavingBank(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          upi_id: upiId.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      push("success", "UPI payment details updated successfully!");
      refresh();
    } catch (err: any) {
      push("error", err.message || "Could not save payment details.");
    } finally {
      setSavingBank(false);
    }
  }

  async function handleSavePolicy(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.org_id) return;
    setSavingPolicy(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          capital_pool_limit: Number(maxLoanLimit) || 2500000,
        })
        .eq("id", profile.org_id);

      if (error) throw error;

      push("success", "Organization lending policy & capital pool ceiling updated!");
    } catch (err: any) {
      push("error", err.message || "Failed to update lending policy.");
    } finally {
      setSavingPolicy(false);
    }
  }

  async function handleResetPassword() {
    if (!profile?.email) return;
    setResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      push("success", `Password reset link sent to ${profile.email}`);
    } catch (err: any) {
      push("error", err.message || "Could not send password reset email.");
    } finally {
      setResettingPassword(false);
    }
  }

  function handleExportData() {
    const exportContent = JSON.stringify(
      {
        user_id: profile?.id,
        name: profile?.full_name,
        email: profile?.email,
        role: userRole,
        org_id: profile?.org_id,
        bank_details: {
          bank_name: bankName,
          account_number: accountNumber,
          ifsc_code: ifscCode,
          upi_id: upiId,
        },
        preferences: {
          emailLoanUpdates,
          emailRepaymentReminders,
          inAppToasts,
          monthlyStatement,
          twoFactorAuth,
        },
        exported_at: new Date().toISOString(),
      },
      null,
      2
    );

    const blob = new Blob([exportContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sahayam-account-data-${profile?.id?.slice(0, 8) || "user"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push("info", "Account data exported to JSON format.");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage application preferences, bank accounts, notification channels, and platform guidelines.
          </p>
        </div>

        {/* Link to Profile Page */}
        <Link
          href={profileHref}
          className="inline-flex items-center gap-2 text-xs font-semibold text-signal hover:text-signal-hover bg-signal/10 hover:bg-signal/20 px-3.5 py-2 rounded-full transition-colors shrink-0"
        >
          <User className="h-3.5 w-3.5" />
          Edit Profile Details
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(val) => setActiveTab(val as TabValue)} tabs={tabs} />

      {/* Lending Policies Tab (Lender/Superadmin Only) */}
      {activeTab === "policy" && isLender && (
        <form onSubmit={handleSavePolicy} className="space-y-6 animate-fade-in">
          <Card className="space-y-5">
            <div className="flex items-center gap-2 text-signal">
              <Sliders className="h-5 w-5" />
              <CardTitle>Organization Lending Rules</CardTitle>
            </div>
            <CardDescription>
              Configure default credit thresholds, interest rates, and automated verification rules.
            </CardDescription>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div>
                <label className="label">Organization Capital Pool Ceiling (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={maxLoanLimit}
                  onChange={(e) => setMaxLoanLimit(e.target.value)}
                  step="50000"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Total capital ceiling available for employee emergency credit line.
                </span>
              </div>

              <div>
                <label className="label">Standard Annual Interest Rate (%)</label>
                <input
                  type="number"
                  className="input"
                  value={annualInterestRate}
                  onChange={(e) => setAnnualInterestRate(e.target.value)}
                  step="0.1"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Set to 0.0 for interest-free intra-org pool lending.
                </span>
              </div>

              <div>
                <label className="label">Auto-Approval Threshold (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={autoApproveThreshold}
                  onChange={(e) => setAutoApproveThreshold(e.target.value)}
                  step="1000"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Requests below this amount with verified KYC skip manual review.
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-ink dark:text-white">Compliance & Signatures</h4>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">
                    Require Digital E-Signatures
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enforce legally binding internal SHA-256 e-signature agreements before disbursal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRequireDigitalSignatures(!requireDigitalSignatures)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    requireDigitalSignatures ? "bg-signal" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      requireDigitalSignatures ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">
                    Mandatory Employment Checks
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Require employee salary slip / ID verification prior to loan approval.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRequireHrmsVerification(!requireHrmsVerification)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    requireHrmsVerification ? "bg-signal" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      requireHrmsVerification ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-end pt-2">
            <Button type="submit" variant="primary" loading={savingPolicy}>
              <Save className="h-4 w-4 mr-2" />
              Save Policy Guidelines
            </Button>
          </div>
        </form>
      )}

      {/* UPI & Payment Details Tab */}
      {activeTab === "bank" && (
        <form onSubmit={handleSaveBankDetails} className="space-y-6 animate-fade-in">
          <Card className="space-y-5">
            <div className="flex items-center gap-2 text-signal">
              <CreditCard className="h-5 w-5" />
              <CardTitle>UPI Payment Details</CardTitle>
            </div>
            <CardDescription>
              Add or update your primary UPI ID for quick loan disbursals and instant repayment settlements.
            </CardDescription>

            <div className="pt-2">
              <Field label="UPI ID (VPA)" htmlFor="upi_id">
                <Input
                  id="upi_id"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. user@okaxis, user@upi"
                  className="rounded-xl font-medium"
                />
              </Field>
            </div>
          </Card>

          <div className="flex items-center justify-end pt-2">
            <Button type="submit" variant="primary" loading={savingBank}>
              <CreditCard className="h-4 w-4 mr-2" />
              Save Payment Details
            </Button>
          </div>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <Card className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-2 text-signal">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Choose how and when Sahayam communicates critical updates regarding your loans.
          </CardDescription>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-ink dark:text-white">Email Loan Decision Alerts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Receive instant emails when loan applications are approved, disbursed, or rejected.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = !emailLoanUpdates;
                  setEmailLoanUpdates(val);
                  persistPreferences("emailLoanUpdates", val);
                  push("info", `Email alerts ${val ? "enabled" : "disabled"}.`);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  emailLoanUpdates ? "bg-signal" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    emailLoanUpdates ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-ink dark:text-white">Repayment Reminders</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Get reminder emails prior to salary deduction or payment due dates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = !emailRepaymentReminders;
                  setEmailRepaymentReminders(val);
                  persistPreferences("emailRepaymentReminders", val);
                  push("info", `Repayment reminders ${val ? "enabled" : "disabled"}.`);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  emailRepaymentReminders ? "bg-signal" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    emailRepaymentReminders ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-ink dark:text-white">In-App Popups & Notifications</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Display toast popups and bell dropdown updates within the platform.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = !inAppToasts;
                  setInAppToasts(val);
                  persistPreferences("inAppToasts", val);
                  push("info", `In-app toasts ${val ? "enabled" : "disabled"}.`);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  inAppToasts ? "bg-signal" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    inAppToasts ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-ink dark:text-white">Monthly Statement Digest</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Monthly summary of total borrowed, repaid, and active balance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = !monthlyStatement;
                  setMonthlyStatement(val);
                  persistPreferences("monthlyStatement", val);
                  push("info", `Monthly digest ${val ? "enabled" : "disabled"}.`);
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  monthlyStatement ? "bg-signal" : "bg-slate-300 dark:bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    monthlyStatement ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Appearance Tab */}
      {activeTab === "appearance" && (
        <Card className="space-y-6 animate-fade-in">
          <div>
            <CardTitle>Appearance & Theme</CardTitle>
            <CardDescription className="mt-1">
              Select how Sahayam displays across all your devices.
            </CardDescription>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => {
                if (theme !== "light") toggle();
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-3 ${
                theme === "light"
                  ? "border-signal bg-signal/5 dark:bg-signal/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                  <Sun className="h-6 w-6" />
                </div>
                {theme === "light" && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-signal bg-signal/10 px-2.5 py-1 rounded-full">
                    <Check className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-ink dark:text-white text-base">Light Theme</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Clean, crisp interface optimized for daytime usage and clarity.
                </p>
              </div>
            </div>

            <div
              onClick={() => {
                if (theme !== "dark") toggle();
              }}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-3 ${
                theme === "dark"
                  ? "border-signal bg-signal/5 dark:bg-signal/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Moon className="h-6 w-6" />
                </div>
                {theme === "dark" && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-signal bg-signal/10 px-2.5 py-1 rounded-full">
                    <Check className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-ink dark:text-white text-base">Dark Theme</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sleek dark mode tailored for low light environments and reduced eye strain.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Security & Account Tab */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-fade-in">
          <Card className="space-y-5">
            <div className="flex items-center gap-2 text-signal">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Controls</CardTitle>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">Two-Factor Authentication (2FA)</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Require SMS or authenticator code during login.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const val = !twoFactorAuth;
                    setTwoFactorAuth(val);
                    persistPreferences("twoFactorAuth", val);
                    push("info", `2FA status ${val ? "enabled" : "disabled"}.`);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    twoFactorAuth ? "bg-signal" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      twoFactorAuth ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">Account Password</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Secured via Supabase authentication.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  loading={resettingPassword}
                  onClick={handleResetPassword}
                  className="text-xs py-1.5 h-auto"
                >
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Reset Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-ink dark:text-white">Active Session</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Current active session on this web browser.
                  </p>
                </div>
                <span className="badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
                  <Smartphone className="h-3 w-3 mr-1" /> Active Now
                </span>
              </div>
            </div>
          </Card>

          {/* Export & Data */}
          <Card className="space-y-4">
            <CardTitle>Data Privacy & Portability</CardTitle>
            <CardDescription>
              Download a complete JSON archive of your personal profile and lending history.
            </CardDescription>

            <Button variant="secondary" onClick={handleExportData} className="text-xs">
              <Download className="h-4 w-4 mr-2" />
              Export My Account Data
            </Button>
          </Card>

          {/* Danger Zone / Sign Out */}
          <Card className="border-danger/30 bg-danger/5 dark:bg-danger/10 space-y-4">
            <div>
              <CardTitle className="text-danger">Sign Out of Session</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Safely end your current session on this device.
              </CardDescription>
            </div>

            <Button variant="danger" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
