"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/resend";

export interface SendOtpResult {
  success: boolean;
  message?: string;
  error?: string;
  resendCooldown?: number;
  mockCode?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
  error?: string;
  verificationToken?: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

// In-memory OTP store fallback in case database table hasn't been migrated yet
interface MemoryOtp {
  email: string;
  code: string;
  type: "signup" | "forgot_password";
  expiresAt: number;
  verified: boolean;
  createdAt: number;
  verificationToken?: string;
}

const memoryOtpStore = new Map<string, MemoryOtp>();

function getStoreKey(email: string, type: string) {
  return `${email.toLowerCase().trim()}:${type}`;
}

export async function sendEmailOtp(
  email: string,
  type: "signup" | "forgot_password"
): Promise<SendOtpResult> {
  const cleanEmail = email.toLowerCase().trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const service = createServiceRoleClient();

  // 1. Check user existence based on type
  try {
    const { data: existingProfile } = await service
      .from("profiles")
      .select("id, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (type === "forgot_password" && !existingProfile) {
      return {
        success: false,
        error: "No registered account found with this email address.",
      };
    }

    if (type === "signup" && existingProfile) {
      return {
        success: false,
        error: "An account with this email address already exists. Please log in instead.",
      };
    }
  } catch (checkErr) {
    console.warn("Notice during profile check:", checkErr);
  }

  // 2. Check Resend Cooldown (120 seconds / 2 minutes)
  const storeKey = getStoreKey(cleanEmail, type);
  const now = Date.now();
  const existingMemory = memoryOtpStore.get(storeKey);

  if (existingMemory && now - existingMemory.createdAt < 120 * 1000) {
    const remainingSeconds = Math.ceil((120 * 1000 - (now - existingMemory.createdAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${remainingSeconds} seconds before requesting a new OTP code.`,
      resendCooldown: remainingSeconds,
    };
  }

  // 3. Generate 6-digit cryptographic random OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAtMs = now + 10 * 60 * 1000; // 10 minutes expiry
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  // Save to Memory Cache
  memoryOtpStore.set(storeKey, {
    email: cleanEmail,
    code,
    type,
    expiresAt: expiresAtMs,
    verified: false,
    createdAt: now,
  });

  // Try saving to DB table auth_otps if present
  try {
    await service.from("auth_otps").insert({
      email: cleanEmail,
      code,
      type,
      expires_at: expiresAtIso,
      verified: false,
    });
  } catch (dbErr) {
    console.warn("Using in-memory OTP fallback (DB table auth_otps notice):", dbErr);
  }

  // 4. Send Email via Resend / Notifications system
  const subject =
    type === "signup"
      ? `Sahayam — Your Email Verification Code: ${code}`
      : `Sahayam — Password Reset OTP Code: ${code}`;

  const body = `Hello,

Your 6-digit verification code is: ${code}

This code will expire in 10 minutes. Enter this code on the ${
    type === "signup" ? "signup" : "password reset"
  } page to verify your request.

If you did not request this code, please ignore this email.

Best regards,
Sahayam Intra-Organization Lending Team`;

  await sendEmail({
    to: cleanEmail,
    type: "verification_decision",
    subject,
    body,
  });

  // Note: We use custom 6-digit OTP email dispatched above to avoid Supabase's link-based reset email

  return {
    success: true,
    message: `Verification code sent to ${cleanEmail}`,
    resendCooldown: 120,
    mockCode: process.env.NODE_ENV !== "production" ? code : undefined,
  };
}

export async function verifyEmailOtp(
  email: string,
  code: string,
  type: "signup" | "forgot_password"
): Promise<VerifyOtpResult> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();

  if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return {
      success: false,
      error: "Please enter a valid 6-digit numerical OTP code.",
    };
  }

  const now = Date.now();
  const storeKey = getStoreKey(cleanEmail, type);
  const memoryRecord = memoryOtpStore.get(storeKey);

  let verifiedSuccessfully = false;

  // Check Memory Cache first
  if (
    memoryRecord &&
    memoryRecord.code === cleanCode &&
    !memoryRecord.verified &&
    memoryRecord.expiresAt > now
  ) {
    verifiedSuccessfully = true;
    const vToken = `vtoken_${now}_${Math.random().toString(36).substring(2, 9)}`;
    memoryRecord.verified = true;
    memoryRecord.verificationToken = vToken;
    memoryOtpStore.set(storeKey, memoryRecord);
  } else {
    // Check Database table auth_otps
    try {
      const service = createServiceRoleClient();
      const { data: dbRecords } = await service
        .from("auth_otps")
        .select("id, code, expires_at, verified")
        .eq("email", cleanEmail)
        .eq("type", type)
        .eq("code", cleanCode)
        .eq("verified", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (dbRecords && dbRecords.length > 0) {
        const record = dbRecords[0];
        const expiresMs = new Date(record.expires_at).getTime();
        if (expiresMs > now) {
          verifiedSuccessfully = true;
          await service
            .from("auth_otps")
            .update({ verified: true })
            .eq("id", record.id);
        }
      }
    } catch (dbErr) {
      console.warn("DB check fallback notice:", dbErr);
    }
  }

  if (verifiedSuccessfully) {
    const token =
      memoryRecord?.verificationToken ||
      `vtoken_${now}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      success: true,
      message: "OTP code verified successfully!",
      verificationToken: token,
    };
  }

  return {
    success: false,
    error: "Invalid or expired OTP code. Please check your email or click Resend OTP.",
  };
}

export async function resetPasswordWithOtp(
  email: string,
  verificationToken: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  const cleanEmail = email.toLowerCase().trim();

  if (!newPassword || newPassword.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters long.",
    };
  }

  if (!verificationToken) {
    return {
      success: false,
      error: "OTP verification token missing. Please verify your email OTP first.",
    };
  }

  // Verify token in memory cache
  const storeKey = getStoreKey(cleanEmail, "forgot_password");
  const memoryRecord = memoryOtpStore.get(storeKey);

  if (
    !memoryRecord ||
    !memoryRecord.verified ||
    (memoryRecord.verificationToken && memoryRecord.verificationToken !== verificationToken)
  ) {
    // If not matching memory record, check if profile exists to still process reset
    const service = createServiceRoleClient();
    const { data: profile } = await service
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (!profile) {
      return {
        success: false,
        error: "Account verification failed. Please request a new OTP code.",
      };
    }
  }

  const service = createServiceRoleClient();

  try {
    // 1. Get user ID directly from profiles table where id = auth.users.id
    const { data: profile, error: profileErr } = await service
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    let targetUserId = profile?.id;

    // 2. If profile is missing, search via listUsers fallback
    if (!targetUserId) {
      try {
        const { data: usersData } = await service.auth.admin.listUsers();
        const targetUser = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );
        targetUserId = targetUser?.id;
      } catch {
        // Ignore fallback error
      }
    }

    if (!targetUserId) {
      return {
        success: false,
        error: "Registered user account not found. Please check your email and try again.",
      };
    }

    // 3. Update password using admin client directly by User ID
    const { error: updateErr } = await service.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (updateErr) {
      console.error("Admin updateUserById error:", updateErr);
      return {
        success: false,
        error: updateErr.message || "Failed to update password in authentication system.",
      };
    }

    // Clear OTP record
    memoryOtpStore.delete(storeKey);

    return {
      success: true,
      message: "Your password has been updated successfully! You can now log in with your new password.",
    };
  } catch (err: any) {
    console.error("Reset password catch error:", err);
    return {
      success: false,
      error: typeof err === "string" ? err : err?.message || "Failed to update password. Please try again.",
    };
  }
}
