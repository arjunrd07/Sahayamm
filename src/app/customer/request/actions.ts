"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { calculateLoan } from "@/lib/loan-math";
import { dispatchNotification } from "@/lib/notify";
import { formatINR } from "@/lib/utils";

export interface RequestLoanInput {
  amount: number;
  purpose: string;
  durationDays: number;
  interestRateAnnual: number;
}

export async function requestLoan(input: RequestLoanInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found." };
  if (profile.verification_status !== "verified") {
    return { error: "You must be verified before requesting a loan." };
  }
  if (input.amount <= 0 || input.durationDays <= 0) {
    return { error: "Enter a valid amount and duration." };
  }

  const calc = calculateLoan(input.amount, input.interestRateAnnual, input.durationDays);

  const { data: loan, error } = await supabase
    .from("loans")
    .insert({
      org_id: profile.org_id,
      customer_id: profile.id,
      amount: calc.principal,
      purpose: input.purpose,
      duration_days: input.durationDays,
      interest_rate_annual: input.interestRateAnnual,
      calculated_interest: calc.interest,
      total_repayment: calc.totalRepayment,
      due_date: calc.dueDate,
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
      params: { customerName: profile.full_name, amount: formatINR(calc.principal), purpose: input.purpose },
    });
  }

  return { data: loan };
}
