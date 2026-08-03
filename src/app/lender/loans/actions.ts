"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { createLendingAgreement, generateAgreementNumber } from "@/lib/docuseal";
import { dispatchNotification } from "@/lib/notify";
import { formatINR } from "@/lib/utils";
import type { Organization, Profile } from "@/types/database";

async function requireLender() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, lender: null };
  const { data: lender } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (
    !lender ||
    (lender.role !== "lender" && lender.role !== "admin" && lender.role !== "superadmin")
  ) {
    return { supabase, lender: null };
  }
  return { supabase, lender };
}

export async function approveLoan(loanId: string, disbursalProofUrl?: string) {
  const { supabase, lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const now = new Date().toISOString();
  const status = disbursalProofUrl ? "active" : "approved";

  const updateData: Record<string, any> = {
    status,
    admin_id: lender.id,
    approved_at: now,
  };

  if (disbursalProofUrl) {
    updateData.disbursal_proof_url = disbursalProofUrl;
    updateData.disbursed_at = now;
    updateData.active_at = now;
  }

  const { data: loan, error } = await supabase
    .from("loans")
    .update(updateData)
    .eq("id", loanId)
    .eq("org_id", lender.org_id)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error || !loan) return { error: error?.message || "Could not approve loan." };

  // Record payment in loan_payments table if proof was attached
  if (disbursalProofUrl) {
    try {
      await supabase.from("loan_payments").insert({
        loan_id: loan.id,
        org_id: lender.org_id,
        borrower_id: loan.customer_id,
        amount: loan.amount,
        payment_proof_url: disbursalProofUrl,
        payment_type: "disbursal",
        status: "verified",
      });
    } catch (paymentErr) {
      console.warn("Payment proof record insertion notice:", paymentErr);
    }
  }

  const service = createServiceRoleClient();
  const [{ data: org }, { data: borrower }] = await Promise.all([
    service.from("organizations").select("*").eq("id", lender.org_id).maybeSingle(),
    service.from("profiles").select("*").eq("id", loan.customer_id).maybeSingle(),
  ]);

  const { count } = await service
    .from("agreements")
    .select("id", { count: "exact", head: true })
    .eq("org_id", lender.org_id);
  const agreementNumber = generateAgreementNumber((count || 0) + 1);

  const result = await createLendingAgreement({
    loan,
    organization: org as Organization,
    borrower: borrower as Profile,
    lender: lender as Profile,
    agreementNumber,
  });

  const { data: agreement } = await service
    .from("agreements")
    .insert({
      org_id: lender.org_id,
      loan_id: loan.id,
      agreement_number: agreementNumber,
      docuseal_submission_id: result.docusealSubmissionId,
      status: result.status,
    })
    .select()
    .maybeSingle();

  if (borrower) {
    await dispatchNotification({
      orgId: lender.org_id,
      userId: loan.customer_id,
      userEmail: (borrower as Profile).email,
      loanId: loan.id,
      type: "loan_approved",
      params: { amount: formatINR(loan.total_repayment) },
    });

    if (disbursalProofUrl) {
      await dispatchNotification({
        orgId: lender.org_id,
        userId: loan.customer_id,
        userEmail: (borrower as Profile).email,
        loanId: loan.id,
        type: "funds_sent",
        params: { amount: formatINR(loan.amount), dueDate: loan.due_date || "" },
      });
    }

    if (agreement) {
      await dispatchNotification({
        orgId: lender.org_id,
        userId: loan.customer_id,
        userEmail: (borrower as Profile).email,
        loanId: loan.id,
        type: "agreement_ready",
        params: { agreementNumber },
      });
    }
  }

  return { data: loan };
}

export async function rejectLoan(loanId: string, reason: string) {
  const { supabase, lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const { data: loan, error } = await supabase
    .from("loans")
    .update({
      status: "rejected",
      admin_id: lender.id,
      rejection_reason: reason,
      approved_at: new Date().toISOString(),
    })
    .eq("id", loanId)
    .eq("org_id", lender.org_id)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error || !loan) return { error: error?.message || "Could not reject loan." };

  const service = createServiceRoleClient();
  const { data: borrower } = await service
    .from("profiles")
    .select("email")
    .eq("id", loan.customer_id)
    .maybeSingle();

  if (borrower) {
    await dispatchNotification({
      orgId: lender.org_id,
      userId: loan.customer_id,
      userEmail: borrower.email,
      loanId: loan.id,
      type: "loan_rejected",
      params: { amount: formatINR(loan.amount), reason },
    });
  }

  return { data: loan };
}

export async function uploadDisbursalProof(loanId: string, proofPath: string) {
  const { supabase, lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const { data: loan, error } = await supabase
    .from("loans")
    .update({
      status: "active",
      disbursal_proof_url: proofPath,
      disbursed_at: new Date().toISOString(),
      active_at: new Date().toISOString(),
    })
    .eq("id", loanId)
    .eq("org_id", lender.org_id)
    .eq("status", "approved")
    .select()
    .maybeSingle();

  if (error || !loan) return { error: error?.message || "Could not mark loan active." };

  // Record proof in loan_payments
  try {
    await supabase.from("loan_payments").insert({
      loan_id: loan.id,
      org_id: lender.org_id,
      borrower_id: loan.customer_id,
      amount: loan.amount,
      payment_proof_url: proofPath,
      payment_type: "disbursal",
      status: "verified",
    });
  } catch (paymentErr) {
    console.warn("Loan payment record notice:", paymentErr);
  }

  const service = createServiceRoleClient();
  const { data: borrower } = await service
    .from("profiles")
    .select("email")
    .eq("id", loan.customer_id)
    .maybeSingle();

  if (borrower) {
    await dispatchNotification({
      orgId: lender.org_id,
      userId: loan.customer_id,
      userEmail: borrower.email,
      loanId: loan.id,
      type: "funds_sent",
      params: { amount: formatINR(loan.amount), dueDate: loan.due_date || "" },
    });
  }

  return { data: loan };
}

export async function sendRepaymentReminder(loanId: string) {
  const { supabase, lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const { data: loan } = await supabase
    .from("loans")
    .select("*")
    .eq("id", loanId)
    .eq("org_id", lender.org_id)
    .maybeSingle();

  if (!loan) return { error: "Loan not found." };

  const service = createServiceRoleClient();
  const { data: borrower } = await service
    .from("profiles")
    .select("email")
    .eq("id", loan.customer_id)
    .maybeSingle();

  if (!borrower) return { error: "Borrower profile not found." };

  await dispatchNotification({
    orgId: lender.org_id,
    userId: loan.customer_id,
    userEmail: borrower.email,
    loanId: loan.id,
    type: "repayment_reminder",
    params: { amount: formatINR(loan.total_repayment), dueDate: loan.due_date || "Soon" },
  });

  return { success: true };
}

export async function verifyRepaymentAndComplete(loanId: string) {
  const { supabase, lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const { data: loan, error } = await supabase
    .from("loans")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", loanId)
    .eq("org_id", lender.org_id)
    .eq("status", "active")
    .select()
    .maybeSingle();

  if (error || !loan) return { error: error?.message || "Could not complete loan." };

  const service = createServiceRoleClient();
  const { data: borrower } = await service
    .from("profiles")
    .select("email")
    .eq("id", loan.customer_id)
    .maybeSingle();

  if (borrower) {
    await dispatchNotification({
      orgId: lender.org_id,
      userId: loan.customer_id,
      userEmail: borrower.email,
      loanId: loan.id,
      type: "loan_completed",
      params: { amount: formatINR(loan.total_repayment) },
    });
  }

  return { data: loan };
}
