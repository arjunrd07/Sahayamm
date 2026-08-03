"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitRepaymentProof(loanId: string, proofPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: loan, error } = await supabase
    .from("loans")
    .update({ repayment_proof_url: proofPath, repayment_submitted_at: new Date().toISOString() })
    .eq("id", loanId)
    .eq("customer_id", user.id)
    .eq("status", "active")
    .select()
    .maybeSingle();

  if (error || !loan) return { error: error?.message || "Could not submit repayment proof." };

  // Record payment in loan_payments table
  try {
    await supabase.from("loan_payments").insert({
      loan_id: loan.id,
      org_id: loan.org_id,
      borrower_id: user.id,
      amount: loan.total_repayment,
      payment_proof_url: proofPath,
      payment_type: "repayment",
      status: "submitted",
    });
  } catch (paymentErr) {
    console.warn("Repayment proof record notice:", paymentErr);
  }

  return { data: loan };
}
