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

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return { error: "Profile not found." };
  if (profile.verification_status !== "verified") {
    return { error: "You must be verified before requesting a loan." };
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
    const days = input.durationDays || 7;
    if (![7, 14, 21].includes(days)) return { error: "Loan duration must be 7, 14, or 21 days." };
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
    .maybeSingle();

  if (error || !loan) return { error: error?.message || "Could not submit request." };

  const customerName = profile.full_name || profile.email || "Borrower";

  // 1. Notify Borrower Confirmation
  await dispatchNotification({
    orgId: profile.org_id,
    userId: profile.id,
    userEmail: profile.email,
    loanId: loan.id,
    type: "loan_requested",
    params: { customerName, amount: formatINR(loan.amount), purpose: input.purpose },
  });

  // 2. Notify Lenders in the Organization
  const admin = createServiceRoleClient();
  const { data: lenders } = await admin
    .from("profiles")
    .select("id, email")
    .eq("org_id", profile.org_id)
    .in("role", ["lender", "superadmin"]);

  for (const l of lenders || []) {
    if (l.id !== profile.id) {
      await dispatchNotification({
        orgId: profile.org_id,
        userId: l.id,
        userEmail: l.email,
        loanId: loan.id,
        type: "loan_requested",
        params: { customerName, amount: formatINR(loan.amount), purpose: input.purpose },
      });
    }
  }

  return { data: loan };
}
