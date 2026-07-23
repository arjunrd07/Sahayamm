"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Repayment proof submission isn't one of the spec's notification
 * types (only the outcomes — completed / overdue — are), so this just
 * records the proof. Admins see it show up in their Active Loans queue
 * to verify and mark the loan Completed.
 */
export async function submitRepaymentProof(loanId: string, proofPath: string) {
  const supabase = createClient();
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
    .single();

  if (error || !loan) return { error: error?.message || "Could not submit repayment proof." };
  return { data: loan };
}
