"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/layout/auth-shell";
import { Field, Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { sendEmailOtp, verifyEmailOtp, resetPasswordWithOtp } from "../actions/otp";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form fields
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(120); // 2 minutes (120 seconds) countdown
  const [timerActive, setTimerActive] = useState(false);

  const { push } = useToast();
  const router = useRouter();

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

  // Handle Step 1: Send OTP to Email
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      push("error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await sendEmailOtp(cleanEmail, "forgot_password");

      if (!res.success) {
        push("error", res.error || "Failed to send OTP code.");
        setLoading(false);
        return;
      }

      push("success", res.message || `OTP sent to ${cleanEmail}`);

      setStep(2);
      setResendTimer(res.resendCooldown || 120);
      setTimerActive(true);
    } catch {
      push("error", "An error occurred while sending OTP code.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Resend OTP
  async function handleResendOtp() {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const res = await sendEmailOtp(email, "forgot_password");
      if (!res.success) {
        push("error", res.error || "Failed to resend OTP code.");
      } else {
        push("success", "A new OTP code has been sent to your email!");
        setResendTimer(120);
        setTimerActive(true);
      }
    } catch {
      push("error", "Failed to resend OTP code.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 2: Verify 6-digit OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();

    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      push("error", "Please enter a valid 6-digit OTP code.");
      return;
    }

    setLoading(true);

    try {
      const res = await verifyEmailOtp(email, cleanCode, "forgot_password");

      if (!res.success) {
        push("error", res.error || "Invalid OTP code.");
        setLoading(false);
        return;
      }

      push("success", "Email verified successfully! Please enter your new password.");
      setVerificationToken(res.verificationToken || "verified");
      setStep(3);
    } catch {
      push("error", "An error occurred while verifying OTP.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Step 3: Update Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      push("error", "New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      push("error", "Passwords do not match. Please check and try again.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPasswordWithOtp(email, verificationToken, newPassword);

      if (!res.success) {
        push("error", res.error || "Failed to update password.");
        setLoading(false);
        return;
      }

      push("success", res.message || "Password updated successfully!");
      router.push("/login");
    } catch {
      push("error", "Failed to reset password. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={
        step === 1
          ? "Forgot Your Password?"
          : step === 2
          ? "Verify Email OTP"
          : "Set New Password"
      }
      subtitle={
        step === 1
          ? "Enter your registered email address and we'll send you a 6-digit OTP code."
          : step === 2
          ? `Enter the 6-digit code sent to ${email}`
          : "Create a new strong password for your account."
      }
    >
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-surface-border-dark">
        <div className="flex items-center gap-2">
          <span
            className={`h-6 w-6 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
              step >= 1 ? "bg-signal text-white shadow-sm" : "bg-slate-200 dark:bg-white/10 text-ink-slate"
            }`}
          >
            {step > 1 ? "✓" : "1"}
          </span>
          <span className={`text-xs font-bold ${step >= 1 ? "text-ink dark:text-white" : "text-ink-slate"}`}>
            Email
          </span>
        </div>
        <div className="h-0.5 w-10 bg-slate-100 dark:bg-surface-border-dark" />
        <div className="flex items-center gap-2">
          <span
            className={`h-6 w-6 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
              step >= 2 ? "bg-signal text-white shadow-sm" : "bg-slate-200 dark:bg-white/10 text-ink-slate"
            }`}
          >
            {step > 2 ? "✓" : "2"}
          </span>
          <span className={`text-xs font-bold ${step >= 2 ? "text-ink dark:text-white" : "text-ink-slate"}`}>
            Verify OTP
          </span>
        </div>
        <div className="h-0.5 w-10 bg-slate-100 dark:bg-surface-border-dark" />
        <div className="flex items-center gap-2">
          <span
            className={`h-6 w-6 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
              step === 3 ? "bg-signal text-white shadow-sm" : "bg-slate-200 dark:bg-white/10 text-ink-slate"
            }`}
          >
            3
          </span>
          <span className={`text-xs font-bold ${step === 3 ? "text-ink dark:text-white" : "text-ink-slate"}`}>
            New Password
          </span>
        </div>
      </div>

      {/* Step 1: Enter Email */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <Field label="Registered Account Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 text-base font-bold rounded-full shadow-button"
            loading={loading}
          >
            Send OTP Code
          </Button>

          <div className="pt-2 text-center">
            <Link href="/login" className="text-xs font-semibold text-signal hover:underline">
              ← Back to Sign In
            </Link>
          </div>
        </form>
      )}

      {/* Step 2: Verify OTP */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="p-3.5 bg-signal-soft/20 dark:bg-signal/10 border border-signal/30 rounded-xl text-xs text-ink dark:text-white">
            <p className="font-semibold mb-0.5">Verification Code Sent</p>
            <p>
              Please check your inbox at <span className="font-bold underline">{email}</span> and enter the 6-digit OTP code below.
            </p>
          </div>

          <Field label="6-Digit OTP Verification Code" htmlFor="otpCode">
            <Input
              id="otpCode"
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
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
              onClick={handleResendOtp}
              className={`font-bold transition-all ${
                timerActive || loading
                  ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  : "text-signal hover:underline cursor-pointer"
              }`}
            >
              Resend OTP
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 text-base font-bold rounded-full shadow-button"
            loading={loading}
          >
            Verify OTP Code
          </Button>

          <div className="flex justify-between items-center text-xs pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-ink-slate hover:text-ink font-semibold"
            >
              Change Email
            </button>
            <Link href="/login" className="text-signal font-semibold hover:underline">
              Cancel & Sign In
            </Link>
          </div>
        </form>
      )}

      {/* Step 3: Set New Password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            ✓ Email identity verified! Enter your new password below.
          </div>

          <Field label="New Password" htmlFor="newPassword">
            <Input
              id="newPassword"
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Field label="Confirm New Password" htmlFor="confirmPassword">
            <Input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 text-base font-bold rounded-full shadow-button"
            loading={loading}
          >
            Update Password & Sign In
          </Button>

          <div className="pt-2 text-center">
            <Link href="/login" className="text-xs font-semibold text-ink-slate hover:text-ink">
              Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
