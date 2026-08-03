"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/layout/auth-shell";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Organization } from "@/types/database";
import { createUserProfile } from "./actions";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [existingOrgs, setExistingOrgs] = useState<Organization[]>([]);
  const [selectedRole, setSelectedRole] = useState<"borrower" | "lender">("borrower");

  // Step 1 State
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [customOrgName, setCustomOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 Mandatory Verification Details State
  const [panNumber, setPanNumber] = useState("");
  const [cibilScore, setCibilScore] = useState("750");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadOrgs() {
      try {
        const { data, error } = await supabase.from("organizations").select("*").order("name");
        if (!error && data && data.length > 0) {
          setExistingOrgs(data as Organization[]);
          setSelectedOrgId(data[0].id);
        } else {
          setSelectedOrgId(DEFAULT_ORG_ID);
        }
      } catch {
        setSelectedOrgId(DEFAULT_ORG_ID);
      }
    }
    loadOrgs();
  }, []);

  async function handleGoogleSignUp() {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        push("error", error.message);
        setLoading(false);
      }
    } catch {
      push("info", "Google SSO initialized. Redirecting to provider...");
      setLoading(false);
    }
  }

  function handleProceedToStep2(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      push("error", "Full name is required.");
      return;
    }
    if (!email.trim()) {
      push("error", "Email is required.");
      return;
    }
    if (!password || password.length < 6) {
      push("error", "Password must be at least 6 characters.");
      return;
    }
    setStep(2);
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanPan = panNumber.trim().toUpperCase();
    const cleanAddress = address.trim();
    const cleanPhone = phone.trim();
    const parsedCibil = parseInt(cibilScore, 10);

    if (!cleanPan || cleanPan.length !== 10) {
      push("error", "Valid 10-character PAN Card Number is required (e.g., ABCDE1234F).");
      return;
    }
    if (isNaN(parsedCibil) || parsedCibil < 300 || parsedCibil > 900) {
      push("error", "Valid CIBIL Score between 300 and 900 is required.");
      return;
    }
    if (!cleanAddress || cleanAddress.length < 8) {
      push("error", "Full residential address is required.");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      push("error", "Valid 10-digit mobile number is required.");
      return;
    }

    setLoading(true);

    let targetOrgId: string = selectedOrgId || DEFAULT_ORG_ID;

    // Handle new organization creation if specified
    if (selectedOrgId === "new" && customOrgName.trim()) {
      try {
        const generatedCode = customOrgName.trim().toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(2, 6);
        const { data: newOrg } = await supabase
          .from("organizations")
          .insert({
            name: customOrgName.trim(),
            code: generatedCode,
          })
          .select("id")
          .maybeSingle();

        if (newOrg?.id) {
          targetOrgId = newOrg.id;
        }
      } catch (dbErr) {
        console.warn("Using default org due to creation warning:", dbErr);
      }
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, org_id: targetOrgId, role: selectedRole },
      },
    });

    if (authError) {
      push("error", authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      await createUserProfile({
        userId: authData.user.id,
        orgId: targetOrgId,
        fullName,
        email,
        phone: cleanPhone,
        panNumber: cleanPan,
        cibilScore: parsedCibil,
        address: cleanAddress,
        role: selectedRole,
      });

      setLoading(false);

      if (selectedRole === "borrower") {
        push("success", "Borrower details saved & sent to lender dashboard for verification!");
        router.push("/lender/verifications");
      } else if (selectedRole === "lender") {
        push("success", "Lender account created! Redirecting to lender dashboard...");
        router.push("/lender/dashboard");
      } else {
        router.push("/borrower/dashboard");
      }
    } else {
      setLoading(false);
      push("success", "Account created & details submitted! Sent to lender dashboard for verification.");
      router.push("/lender/verifications");
    }
  }

  return (
    <AuthShell
      title={step === 1 ? "Create your account" : "Mandatory Verification Details"}
      subtitle={
        step === 1
          ? "Enter your details and select your organization to get started."
          : "Provide required financial details to complete account creation."
      }
    >
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-surface-border-dark">
        <div className="flex items-center gap-2">
          <span className={`h-6 w-6 rounded-full font-bold text-xs flex items-center justify-center transition-all ${step === 1 ? "bg-signal text-white shadow-sm" : "bg-emerald-500 text-white"}`}>
            {step === 1 ? "1" : "✓"}
          </span>
          <span className="text-xs font-bold text-ink dark:text-white">Account Info</span>
        </div>
        <div className="h-0.5 w-16 bg-slate-100 dark:bg-surface-border-dark" />
        <div className="flex items-center gap-2">
          <span className={`h-6 w-6 rounded-full font-bold text-xs flex items-center justify-center transition-all ${step === 2 ? "bg-signal text-white shadow-sm" : "bg-slate-200 dark:bg-white/10 text-ink-slate"}`}>
            2
          </span>
          <span className={`text-xs font-bold ${step === 2 ? "text-ink dark:text-white" : "text-ink-slate"}`}>
            KYC Verification
          </span>
        </div>
      </div>

      {step === 1 ? (
        <form onSubmit={handleProceedToStep2} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-slate dark:text-slate-400">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole("borrower")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedRole === "borrower"
                    ? "border-signal bg-signal-soft/30 dark:bg-signal/20 text-ink dark:text-white font-bold ring-2 ring-signal/20"
                    : "border-slate-200 dark:border-surface-border-dark hover:bg-slate-50 dark:hover:bg-white/5 text-ink-slate"
                }`}
              >
                <p className="text-sm font-bold text-ink dark:text-white">Borrower</p>
                <p className="text-xs text-ink-slate mt-0.5">Apply for low-interest loans</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("lender")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedRole === "lender"
                    ? "border-signal bg-signal-soft/30 dark:bg-signal/20 text-ink dark:text-white font-bold ring-2 ring-signal/20"
                    : "border-slate-200 dark:border-surface-border-dark hover:bg-slate-50 dark:hover:bg-white/5 text-ink-slate"
                }`}
              >
                <p className="text-sm font-bold text-ink dark:text-white">Lender</p>
                <p className="text-xs text-ink-slate mt-0.5">Manage credit liquidity pools</p>
              </button>
            </div>
          </div>

          <Field label="Organization" htmlFor="org_id">
            <select
              id="org_id"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark text-sm font-bold text-ink dark:text-white focus:ring-2 focus:ring-signal focus:outline-none"
            >
              {existingOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code})
                </option>
              ))}
              <option value="new">+ Create New Organization</option>
            </select>
          </Field>

          {selectedOrgId === "new" && (
            <Field label="New Organization Name" htmlFor="custom_org">
              <Input
                id="custom_org"
                required
                value={customOrgName}
                onChange={(e) => setCustomOrgName(e.target.value)}
                placeholder="e.g. Acme Corporation"
              />
            </Field>
          )}

          <Field label="Full name" htmlFor="full_name">
            <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
          </Field>

          <Field label="Work Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Button type="submit" variant="primary" className="w-full py-3.5 text-base font-bold rounded-full shadow-button">
            Continue
          </Button>

          <div className="pt-4">
            <div className="relative flex py-2 items-center mb-3">
              <div className="flex-grow border-t border-slate-200 dark:border-surface-border-dark"></div>
              <span className="flex-shrink mx-4 text-[11px] font-semibold text-ink-slate uppercase">Or sign up with</span>
              <div className="flex-grow border-t border-slate-200 dark:border-surface-border-dark"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full min-h-[44px] flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark text-sm font-semibold text-ink dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign up with Google
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-surface-border-dark rounded-xl text-xs text-ink-slate dark:text-slate-300">
            <p className="font-semibold text-ink dark:text-white mb-0.5">Mandatory Verification Required</p>
            <p>Please complete valid PAN, CIBIL score, address, and mobile number to issue workspace access.</p>
          </div>

          <Field label="PAN Card Number" htmlFor="pan">
            <Input
              id="pan"
              required
              maxLength={10}
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
            />
          </Field>

          <Field label="CIBIL Credit Score (300 - 900)" htmlFor="cibil">
            <Input
              id="cibil"
              type="number"
              required
              min={300}
              max={900}
              value={cibilScore}
              onChange={(e) => setCibilScore(e.target.value)}
              placeholder="750"
            />
          </Field>

          <Field label="Full Residential Address" htmlFor="address">
            <Input
              id="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="102 Corporate Towers, MG Road"
            />
          </Field>

          <Field label="Mobile Phone Number" htmlFor="phone">
            <Input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
              className="w-1/3 py-3 font-semibold rounded-full"
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-2/3 py-3.5 text-base font-bold rounded-full shadow-button"
              loading={loading}
            >
              Submit & Issue Login
            </Button>
          </div>
        </form>
      )}

      <p className="text-sm text-ink-slate text-center mt-6 font-semibold">
        Already registered?{" "}
        <Link href="/login" className="text-signal font-bold hover:underline">
          Single Sign In
        </Link>
      </p>
    </AuthShell>
  );
}
