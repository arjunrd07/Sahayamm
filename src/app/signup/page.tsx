"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/layout/auth-shell";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Organization, Campus } from "@/types/database";
import { createUserProfile, registerUserAccount } from "./actions";
import { sendEmailOtp, verifyEmailOtp } from "../actions/otp";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

function SignupForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [oauthUserId, setOauthUserId] = useState<string | null>(null);
  const [existingOrgs, setExistingOrgs] = useState<Organization[]>([]);
  const [existingCampuses, setExistingCampuses] = useState<Campus[]>([]);
  const [selectedRole, setSelectedRole] = useState<"borrower" | "lender">("borrower");

  // Step 1 State: org, campus, full_name, email, password
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [customOrgName, setCustomOrgName] = useState("");
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [customCampusName, setCustomCampusName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 OTP State
  const [signupOtpCode, setSignupOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(120); // 2 minutes countdown
  const [timerActive, setTimerActive] = useState(false);

  // Step 3 Mandatory Verification Details State
  const [panNumber, setPanNumber] = useState("");
  const [cibilScore, setCibilScore] = useState("750");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const supabase = createClient();

  // Detect OAuth / URL step param on load - ONLY when explicitly coming from Google OAuth flow
  useEffect(() => {
    async function checkAuthSession() {
      const stepParam = searchParams?.get("step");
      const isOauth = searchParams?.get("oauth") === "google";

      // Only enter OAuth Step 3 flow if explicitly coming from Google OAuth callback
      if (isOauth || stepParam === "3") {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setIsOAuthUser(true);
            setOauthUserId(user.id);
            if (user.email) setEmail(user.email);
            const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
            if (metaName) setFullName(metaName);
            if (user.user_metadata?.role === "lender") setSelectedRole("lender");
            setStep(3);
            return;
          }
        } catch (err) {
          console.warn("Session check notice:", err);
        }
        setStep(3);
      } else {
        // Normal signup starts on Step 1
        setIsOAuthUser(false);
        setOauthUserId(null);
        setStep(1);
      }
    }
    checkAuthSession();
  }, [searchParams]);

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

  // Load campuses when selectedOrgId changes
  useEffect(() => {
    async function loadCampuses() {
      if (!selectedOrgId || selectedOrgId === "new") {
        setExistingCampuses([]);
        setSelectedCampusId("new");
        return;
      }
      try {
        const { data, error } = await supabase
          .from("campuses")
          .select("*")
          .eq("org_id", selectedOrgId)
          .order("name");
        if (!error && data && data.length > 0) {
          setExistingCampuses(data as Campus[]);
          setSelectedCampusId(data[0].id);
        } else {
          setExistingCampuses([]);
          setSelectedCampusId("new");
        }
      } catch {
        setExistingCampuses([]);
        setSelectedCampusId("new");
      }
    }
    loadCampuses();
  }, [selectedOrgId]);

  // 2-minute countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, resendTimer]);

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

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

  // Handle Step 1: Submit Account Info & Trigger Email OTP
  async function handleProceedToStep2(e: React.FormEvent) {
    e.preventDefault();

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanFullName) {
      push("error", "Full name is required.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      push("error", "Valid email address is required.");
      return;
    }
    if (!password || password.length < 6) {
      push("error", "Password must be at least 6 characters.");
      return;
    }
    if (selectedOrgId === "new" && !customOrgName.trim()) {
      push("error", "Please enter a name for the new organization.");
      return;
    }
    if (
      (selectedOrgId === "new" || selectedCampusId === "new" || existingCampuses.length === 0) &&
      !customCampusName.trim()
    ) {
      push("error", "Please enter a campus location name.");
      return;
    }

    setLoading(true);

    try {
      const res = await sendEmailOtp(cleanEmail, "signup");

      if (!res.success) {
        push("error", res.error || "Failed to send verification OTP code.");
        setLoading(false);
        return;
      }

      push("success", res.message || `Verification OTP code sent to ${cleanEmail}!`);

      setStep(2);
      setResendTimer(res.resendCooldown || 120);
      setTimerActive(true);
    } catch {
      push("error", "An error occurred while dispatching verification OTP.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Resend Signup OTP
  async function handleResendSignupOtp() {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const res = await sendEmailOtp(email, "signup");
      if (!res.success) {
        push("error", res.error || "Failed to resend OTP code.");
      } else {
        push("success", "A new OTP verification code has been sent to your email!");
        setResendTimer(120);
        setTimerActive(true);
      }
    } catch {
      push("error", "Failed to resend verification OTP.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 2: Verify Email OTP Code
  async function handleVerifyOtpStep(e: React.FormEvent) {
    e.preventDefault();

    const cleanCode = signupOtpCode.trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      push("error", "Please enter a valid 6-digit OTP verification code.");
      return;
    }

    setLoading(true);

    try {
      const res = await verifyEmailOtp(email, cleanCode, "signup");

      if (!res.success) {
        push("error", res.error || "Invalid or expired OTP code.");
        setLoading(false);
        return;
      }

      push("success", "Email address verified successfully! Please complete your profile details.");
      setStep(3);
    } catch {
      push("error", "An error occurred during OTP verification.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 3: Final Submission & Account Creation
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

    const cleanEmail = email.trim().toLowerCase();

    // Register user account & create database profile atomically via server action
    const regResult = await registerUserAccount({
      email: cleanEmail,
      password: password,
      fullName: fullName.trim(),
      role: selectedRole,
      orgId: selectedOrgId === "new" ? undefined : selectedOrgId,
      customOrgName: selectedOrgId === "new" ? customOrgName.trim() : undefined,
      campusId: selectedCampusId === "new" ? null : selectedCampusId,
      campusName: customCampusName.trim(),
      phone: cleanPhone,
      panNumber: cleanPan,
      cibilScore: parsedCibil,
      address: cleanAddress,
    });

    if (!regResult.success) {
      push("error", regResult.error || "Failed to create user account. Please try again.");
      setLoading(false);
      return;
    }

    // Sign in user session with credentials
    try {
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });
    } catch (signInErr) {
      console.warn("Notice signing in after registration:", signInErr);
    }

    setLoading(false);

    if (selectedRole === "borrower") {
      push("success", "Borrower account created & verified successfully!");
      router.push("/borrower/dashboard");
    } else if (selectedRole === "lender") {
      push("success", "Lender account created! Redirecting to lender dashboard...");
      router.push("/lender/dashboard");
    } else {
      push("success", "Admin account created! Redirecting to admin dashboard...");
      router.push("/admin/dashboard");
    }
  }

  return (
    <AuthShell
      title={
        step === 1
          ? "Create your account"
          : step === 2
          ? "Verify Email OTP"
          : "Financial & Profile Details"
      }
      subtitle={
        step === 1
          ? "Select your Organization, Campus, Role and details to get started."
          : step === 2
          ? `Enter the 6-digit OTP code sent to ${email}`
          : "Provide required details to complete registration."
      }
    >
      {/* 3-Step Header Navigation */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-surface-border-dark">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-5 w-5 rounded-full font-bold text-[11px] flex items-center justify-center transition-all ${
              step > 1 ? "bg-emerald-500 text-white" : "bg-signal text-white shadow-sm"
            }`}
          >
            {step > 1 ? "✓" : "1"}
          </span>
          <span className="text-xs font-bold text-ink dark:text-white">Account Info</span>
        </div>
        <div className="h-0.5 w-8 bg-slate-100 dark:bg-surface-border-dark" />
        <div className="flex items-center gap-1.5">
          <span
            className={`h-5 w-5 rounded-full font-bold text-[11px] flex items-center justify-center transition-all ${
              step === 2
                ? "bg-signal text-white shadow-sm"
                : step > 2
                ? "bg-emerald-500 text-white"
                : "bg-slate-200 dark:bg-white/10 text-ink-slate"
            }`}
          >
            {step > 2 ? "✓" : "2"}
          </span>
          <span
            className={`text-xs font-bold ${
              step >= 2 ? "text-ink dark:text-white" : "text-ink-slate"
            }`}
          >
            Email OTP
          </span>
        </div>
        <div className="h-0.5 w-8 bg-slate-100 dark:bg-surface-border-dark" />
        <div className="flex items-center gap-1.5">
          <span
            className={`h-5 w-5 rounded-full font-bold text-[11px] flex items-center justify-center transition-all ${
              step === 3
                ? "bg-signal text-white shadow-sm"
                : "bg-slate-200 dark:bg-white/10 text-ink-slate"
            }`}
          >
            3
          </span>
          <span
            className={`text-xs font-bold ${
              step === 3 ? "text-ink dark:text-white" : "text-ink-slate"
            }`}
          >
            Profile
          </span>
        </div>
      </div>

      {/* STEP 1: Registration Credentials */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-ink dark:text-white uppercase tracking-wider">
              Account Role
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1 rounded-2xl bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark">
              <button
                type="button"
                onClick={() => setSelectedRole("borrower")}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  selectedRole === "borrower"
                    ? "bg-white dark:bg-canvas-dark text-signal shadow-xs"
                    : "text-ink-slate hover:text-ink dark:hover:text-white"
                }`}
              >
                Borrower (Employee)
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole("lender")}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                  selectedRole === "lender"
                    ? "bg-white dark:bg-canvas-dark text-signal shadow-xs"
                    : "text-ink-slate hover:text-ink dark:hover:text-white"
                }`}
              >
                Lender (Capital Pool)
              </button>
            </div>
          </div>

          <Field label="Organization" htmlFor="org">
            <select
              id="org"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark text-ink dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            >
              {existingOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
              <option value="new">+ Register New Organization</option>
            </select>
          </Field>

          {selectedOrgId === "new" && (
            <Field label="New Organization Name" htmlFor="custom_org">
              <Input
                id="custom_org"
                required
                value={customOrgName}
                onChange={(e) => setCustomOrgName(e.target.value)}
                placeholder="e.g. Acme Innovations Corp"
              />
            </Field>
          )}

          <Field label="Campus / Location" htmlFor="campus">
            <select
              id="campus"
              value={selectedCampusId}
              onChange={(e) => setSelectedCampusId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark text-ink dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-signal"
            >
              {existingCampuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="new">+ Add New Campus Location</option>
            </select>
          </Field>

          {selectedOrgId === "new" && (
            <Field label="Initial Campus Name" htmlFor="custom_campus">
              <Input
                id="custom_campus"
                required
                value={customCampusName}
                onChange={(e) => setCustomCampusName(e.target.value)}
                placeholder="e.g. Raidurg (tcs.raidrug.db)"
              />
            </Field>
          )}

          {selectedOrgId !== "new" && existingCampuses.length > 0 && selectedCampusId === "new" && (
            <Field label="New Campus Name" htmlFor="custom_campus">
              <Input
                id="custom_campus"
                required
                value={customCampusName}
                onChange={(e) => setCustomCampusName(e.target.value)}
                placeholder="e.g. Raidurg Campus"
              />
            </Field>
          )}

          <Field label="Full Name" htmlFor="full_name" required>
            <Input
              id="full_name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </Field>

          <Field label="Work Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </Field>

          <Field label="Password" htmlFor="password" required>
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

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 text-base font-bold rounded-full shadow-button"
            loading={loading}
          >
            Continue & Send Email OTP
          </Button>

          <div className="pt-4">
            <div className="relative flex py-2 items-center mb-3">
              <div className="flex-grow border-t border-slate-200 dark:border-surface-border-dark"></div>
              <span className="flex-shrink mx-4 text-[11px] font-semibold text-ink-slate uppercase">
                Or sign up with
              </span>
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
      )}

      {/* STEP 2: Email OTP Verification */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtpStep} className="space-y-4">
          <div className="p-3.5 bg-signal-soft/20 dark:bg-signal/10 border border-signal/30 rounded-xl text-xs text-ink dark:text-white">
            <p className="font-semibold mb-0.5">Verification Code Sent</p>
            <p>
              We sent a 6-digit OTP verification code to <span className="font-bold underline">{email}</span>. Please enter it below to verify your email.
            </p>
          </div>

          <Field label="6-Digit Signup OTP Code" htmlFor="signupOtpCode">
            <Input
              id="signupOtpCode"
              type="text"
              required
              maxLength={6}
              value={signupOtpCode}
              onChange={(e) => setSignupOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="text-center tracking-widest text-lg font-mono font-bold"
            />
          </Field>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-ink-slate font-medium">
              {timerActive ? (
                <>Resend available in <span className="font-bold text-signal font-mono">{formatTime(resendTimer)}</span></>
              ) : (
                "Didn't receive the OTP code?"
              )}
            </span>

            <button
              type="button"
              disabled={timerActive || loading}
              onClick={handleResendSignupOtp}
              className={`font-bold transition-all ${
                timerActive || loading
                  ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  : "text-signal hover:underline cursor-pointer"
              }`}
            >
              Resend OTP
            </button>
          </div>

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
              Verify & Continue
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: Financial & Profile Details */}
      {step === 3 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-surface-border-dark rounded-xl text-xs text-ink-slate dark:text-slate-300">
            <p className="font-semibold text-ink dark:text-white mb-0.5">
              {isOAuthUser ? "Google Authentication Verified ✓" : "Email Verified ✓"} — Step 3: Profile & KYC Details
            </p>
            <p>Please enter your mandatory PAN Card number, mobile phone, and address to proceed to your dashboard.</p>
          </div>

          {/* Role & Org selection for OAuth users */}
          {isOAuthUser && (
            <>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-ink dark:text-white uppercase tracking-wider">
                  Select Your Account Role
                </label>
                <div className="grid grid-cols-2 gap-2.5 p-1 rounded-2xl bg-slate-100 dark:bg-surface-dark border border-slate-200 dark:border-surface-border-dark">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("borrower")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                      selectedRole === "borrower"
                        ? "bg-white dark:bg-canvas-dark text-signal shadow-xs"
                        : "text-ink-slate hover:text-ink dark:hover:text-white"
                    }`}
                  >
                    Borrower (Employee)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole("lender")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all ${
                      selectedRole === "lender"
                        ? "bg-white dark:bg-canvas-dark text-signal shadow-xs"
                        : "text-ink-slate hover:text-ink dark:hover:text-white"
                    }`}
                  >
                    Lender (Capital Pool)
                  </button>
                </div>
              </div>

              <Field label="Organization" htmlFor="step3_org">
                <select
                  id="step3_org"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark text-ink dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-signal"
                >
                  {existingOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                  <option value="new">+ Register New Organization</option>
                </select>
              </Field>

              {selectedOrgId === "new" && (
                <Field label="New Organization Name" htmlFor="step3_custom_org">
                  <Input
                    id="step3_custom_org"
                    required
                    value={customOrgName}
                    onChange={(e) => setCustomOrgName(e.target.value)}
                    placeholder="e.g. Acme Innovations Corp"
                  />
                </Field>
              )}

              <Field label="Campus / Location" htmlFor="step3_campus">
                <select
                  id="step3_campus"
                  value={selectedCampusId}
                  onChange={(e) => setSelectedCampusId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-surface-border-dark bg-white dark:bg-surface-dark text-ink dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-signal"
                >
                  {existingCampuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="new">+ Add New Campus Location</option>
                </select>
              </Field>

              <Field label="Full Legal Name" htmlFor="step3_fullname" required>
                <Input
                  id="step3_fullname"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </Field>
            </>
          )}

          <Field label="PAN Card Number" htmlFor="pan" required>
            <Input
              id="pan"
              required
              maxLength={10}
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
            />
          </Field>

          <Field label="Mobile Phone Number" htmlFor="phone" required>
            <Input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
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

          <Field label="Full Residential Address" htmlFor="address" required>
            <Input
              id="address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="102 Corporate Towers, MG Road"
            />
          </Field>

          <div className="flex gap-3 pt-2">
            {!isOAuthUser && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(2)}
                className="w-1/3 py-3 font-semibold rounded-full"
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              className={`${isOAuthUser ? "w-full" : "w-2/3"} py-3.5 text-base font-bold rounded-full shadow-button`}
              loading={loading}
            >
              Complete Profile & Enter Dashboard
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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-signal border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
