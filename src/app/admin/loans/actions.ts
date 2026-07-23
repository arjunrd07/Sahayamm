"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { createLendingAgreement, generateAgreementNumber } from "@/lib/docuseal";
import { dispatchNotification } from "@/lib/notify";
import { formatINR } from "@/lib/utils";
import type { Organization, Profile } from "@/types/database";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, admin: null };
  const { data: admin } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!admin || admin.role !== "admin") return { supabase, admin: null };
  return { supabase, admin };
}

export async function approveLoan(loanId: string) {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  const { data: loan, error } = await supabase
    .from("loans")
    .update({ status: "approved", admin_id: admin.id, approved_at: new Date().toISOString() })
    .eq("id", loanId)
    .eq("org_id", admin.org_id)
    .eq("status", "pending")
    .select()
    .single();

  if (error || !loan) return { error: error?.message || "Could not approve loan." };

  const service = createServiceRoleClient();
  const [{ data: org }, { data: borrower }] = await Promise.all([
    service.from("organizations").select("*").eq("id", admin.org_id).single(),
    service.from("profiles").select("*").eq("id", loan.customer_id).single(),
  ]);

  const { count } = await service
    .from("agreements")
    .select("id", { count: "exact", head: true })
    .eq("org_id", admin.org_id);
  const agreementNumber = generateAgreementNumber((count || 0) + 1);

  const result = await createLendingAgreement({
    loan,
    organization: org as Organization,
    borrower: borrower as Profile,
    lender: admin as Profile,
    agreementNumber,
  });

  const { data: agreement } = await service
    .from("agreements")
    .insert({
      org_id: admin.org_id,
      loan_id: loan.id,
      agreement_number: agreementNumber,
      docuseal_submission_id: result.docusealSubmissionId,
      status: result.status,
    })
    .select()
    .single();

  await dispatchNotification({
    orgId: admin.org_id,
    userId: loan.customer_id,
    userEmail: (borrower as Profile).email,
    loanId: loan.id,
    type: "loan_approved",
    params: { amount: formatINR(loan.total_repayment) },
  });

  if (agreement) {
    await dispatchNotification({
      orgId: admin.org_id,
      userId: loan.customer_id,
      userEmail: (borrower as Profile).email,
      loanId: loan.id,
      type: "agreement_ready",
      params: { agreementNumber },
    });
  }

  return { data: loan };
}

export async function rejectLoan(loanId: string, reason: string) {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  const { data: loan, error } = await supabase
    .from("loans")
    .update({
      status: "rejected",
      admin_id: admin.id,
      rejection_reason: reason,
      approved_at: new Date().toISOString(),
    })
    .eq("id", loanId)
    .eq("org_id", admin.org_id)
    .eq("status", "pending")
    .select()
    .single();

  if (error || !loan) return { error: error?.message || "Could not reject loan." };

  const service = createServiceRoleClient();
  const { data: borrower } = await service.from("profiles").select("email").eq("id", loan.customer_id).single();

  await dispatchNotification({
    orgId: admin.org_id,
    userId: loan.customer_id,
    userEmail: borrower!.email,
    loanId: loan.id,
    type: "loan_rejected",
    params: { amount: formatINR(loan.amount), reason },
  });

  return { data: loan };
}

export async function uploadDisbursalProof(loanId: string, proofPath: string) {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  const { data: loan, error } = await supabase
    .from("loans")
    .update({
      status: "active",
      disbursal_proof_url: proofPath,
      disbursed_at: new Date().toISOString(),
      active_at: new Date().toISOString(),
    })
    .eq("id", loanId)
    .eq("org_id", admin.org_id)
    .eq("status", "approved")
    .select()
    .single();

  if (error || !loan) return { error: error?.message || "Could not mark loan active." };

  const service = createServiceRoleClient();
  const { data: borrower } = await service.from("profiles").select("email").eq("id", loan.customer_id).single();

  await dispatchNotification({
    orgId: admin.org_id,
    userId: loan.customer_id,
    userEmail: borrower!.email,
    loanId: loan.id,
    type: "funds_sent",
    params: { amount: formatINR(loan.amount), dueDate: loan.due_date || "" },
  });

  return { data: loan };
}

export async function verifyRepaymentAndComplete(loanId: string) {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  const { data: loan, error } = await supabase
    .from("loans")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", loanId)
    .eq("org_id", admin.org_id)
    .eq("status", "active")
    .select()
    .single();

  if (error || !loan) return { error: error?.message || "Could not complete loan." };

  const service = createServiceRoleClient();
  const { data: borrower } = await service.from("profiles").select("email").eq("id", loan.customer_id).single();

  await dispatchNotification({
    orgId: admin.org_id,
    userId: loan.customer_id,
    userEmail: borrower!.email,
    loanId: loan.id,
    type: "loan_completed",
    params: { amount: formatINR(loan.total_repayment) },
  });

  return { data: loan };
}
