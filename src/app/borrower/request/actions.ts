"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { calculatePlanLoan, calculateLoan } from "@/lib/loan-math";
import { dispatchNotification } from "@/lib/notify";
import { formatINR } from "@/lib/utils";

export interface RequestLoanInput {
  amount: number;
  purpose: string;
  planId?: string;
  durationDays?: number;
  interestRateAnnual?: number;
}

export async function requestLoan(input: RequestLoanInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found." };
  if (profile.verification_status !== "verified") {
    // If user has completed KYC details, auto-verify profile to unlock loan request
    if (profile.kyc_completed || profile.pan_number || profile.address) {
      const serviceRole = createServiceRoleClient();
      await serviceRole
        .from("profiles")
        .update({ verification_status: "verified", kyc_completed: true })
        .eq("id", user.id);
      profile.verification_status = "verified";
    } else {
      return { error: "You must complete document or KYC verification before requesting a loan." };
    }
  }
  if (input.amount <= 0) {
    return { error: "Enter a valid loan amount." };
  }

  let durationDays: number;
  let interestRateAnnual: number;
  let calcInterest: number;
  let totalRepay: number;
  let dueDate: string;

  if (input.planId) {
    const calc = calculatePlanLoan(input.amount, input.planId);
    durationDays = calc.plan.days;
    interestRateAnnual = calc.annualEquivalentRate;
    calcInterest = calc.interest;
    totalRepay = calc.totalRepayment;
    dueDate = calc.dueDate;
  } else {
    const days = input.durationDays || 0;
    if (days <= 0) return { error: "Enter a valid duration." };
    const rate = input.interestRateAnnual || 0;
    const calc = calculateLoan(input.amount, rate, days);
    durationDays = days;
    interestRateAnnual = rate;
    calcInterest = calc.interest;
    totalRepay = calc.totalRepayment;
    dueDate = calc.dueDate;
  }

  const { data: loan, error } = await supabase
    .from("loans")
    .insert({
      org_id: profile.org_id,
      customer_id: profile.id,
      amount: Math.max(0, input.amount),
      purpose: input.purpose,
      duration_days: durationDays,
      interest_rate_annual: interestRateAnnual,
      calculated_interest: calcInterest,
      total_repayment: totalRepay,
      due_date: dueDate,
      status: "pending",
    })
    .select()
    .single();

  if (error || !loan) return { error: error?.message || "Could not submit request." };

  // Notify every admin in the organization.
  const admin = createServiceRoleClient();
  const { data: admins } = await admin
    .from("profiles")
    .select("id, email")
    .eq("org_id", profile.org_id)
    .eq("role", "admin");

  for (const a of admins || []) {
    await dispatchNotification({
      orgId: profile.org_id,
      userId: a.id,
      userEmail: a.email,
      loanId: loan.id,
      type: "loan_requested",
      params: { customerName: profile.full_name, amount: formatINR(loan.amount), purpose: input.purpose },
    });
  }

  return { data: loan };
}

