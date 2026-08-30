"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { createLendingAgreement, generateAgreementNumber } from "@/lib/agreements";
import { dispatchNotification } from "@/lib/notify";
import { formatINR } from "@/lib/utils";
import { logAuditEntry } from "@/lib/audit";
import type { Organization, Profile } from "@/types/database";

async function requireLender() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, lender: null };

  const service = createServiceRoleClient();
  let { data: lender } = await service.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const userRole = user.user_metadata?.role || lender?.role || "lender";
  if (lender && !lender.role) {
    lender.role = userRole;
  }

  if (
    !lender ||
    (lender.role !== "lender" && lender.role !== "admin")
  ) {
    return { supabase, lender: null };
  }
  return { supabase, lender };
}

export async function getLenderLoansForDashboard() {
  const { lender } = await requireLender();
  if (!lender) return { loans: [], error: "Not authorized." };

  const service = createServiceRoleClient();
  const orgId = lender.org_id;

  let query = service
    .from("loans")
    .select("*")
    .order("created_at", { ascending: false });

  if (lender.role !== "admin") {
    query = query.eq("org_id", orgId);
  }

  const [{ data: loansData }, { data: profilesData }, { data: campusesData }] = await Promise.all([
    query,
    service.from("profiles").select("id, full_name, email, campus_id, pan_number, employee_id"),
    service.from("campuses").select("id, name, code"),
  ]);

  const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));
  const campusesMap = new Map((campusesData || []).map((c: any) => [c.id, c.name]));

  let enrichedLoans = (loansData || []).map((l: any) => {
    const customer = profilesMap.get(l.customer_id);
    return {
      ...l,
      customer: customer ? {
        ...customer,
        campus_name: customer.campus_id ? campusesMap.get(customer.campus_id) || "Main Campus" : "Main Campus",
      } : undefined,
    };
  });

  // If lender is assigned to a specific campus, restrict to borrowers of the same campus
  if (lender.role !== "admin" && lender.campus_id) {
    enrichedLoans = enrichedLoans.filter((l: any) => l.customer?.campus_id === lender.campus_id);
  }

  return { loans: enrichedLoans };
}

export async function approveLoan(loanId: string, disbursalProofUrl?: string) {
  const { lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const service = createServiceRoleClient();

  // 1. Fetch loan and borrower profile to verify organization & campus isolation
  const { data: targetLoan } = await service
    .from("loans")
    .select("*")
    .eq("id", loanId)
    .maybeSingle();

  if (!targetLoan) return { error: "Loan record not found." };

  const { data: borrower } = await service
    .from("profiles")
    .select("*")
    .eq("id", targetLoan.customer_id)
    .maybeSingle();

  if (!borrower) return { error: "Borrower record not found." };

  // Tenant isolation checks
  if (lender.role !== "admin") {
    if (targetLoan.org_id !== lender.org_id || borrower.org_id !== lender.org_id) {
      return { error: "Forbidden: You can only approve loans within your assigned organization." };
    }
    if (lender.campus_id && borrower.campus_id && borrower.campus_id !== lender.campus_id) {
      return { error: "Forbidden: You can only approve loans within your assigned campus." };
    }
  }

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

  const { data: loan, error } = await service
    .from("loans")
    .update(updateData)
    .eq("id", loanId)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error || !loan) return { error: error?.message || "Could not approve loan." };

  // Record payment in loan_payments table if proof was attached
  if (disbursalProofUrl) {
    try {
      await service.from("loan_payments").insert({
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

  const { data: org } = await service
    .from("organizations")
    .select("*")
    .eq("id", lender.org_id)
    .maybeSingle();

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
      borrower_id: loan.customer_id,
      lender_id: lender.id,
      agreement_number: agreementNumber,
      pdf_url: result?.pdfUrl || null,
      status: "active",
    })
    .select()
    .maybeSingle();

  if (borrower) {
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

  await logAuditEntry({
    action: disbursalProofUrl ? "Disburse Loan & Activate" : "Approve Loan Request",
    actor_id: lender.id,
    entity_type: "loan",
    entity_id: loan.id,
    details: disbursalProofUrl
      ? `Lender ${lender.full_name || lender.email} approved & disbursed ${formatINR(loan.amount)} (Total Repayment: ${formatINR(loan.total_repayment)}) for loan request ${loan.id}.`
      : `Lender ${lender.full_name || lender.email} approved loan request ${loan.id} for ${formatINR(loan.amount)}.`,
  });

  if (agreement) {
    await logAuditEntry({
      action: "Create Lending Agreement",
      actor_id: lender.id,
      entity_type: "agreement",
      entity_id: agreement.id,
      details: `Lending agreement ${agreementNumber} created for loan ${loan.id} between borrower and lender.`,
    });
  }

  return { data: loan };
}

export async function rejectLoan(loanId: string, reason: string) {
  const { lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const service = createServiceRoleClient();

  // Tenant isolation checks
  const { data: targetLoan } = await service
    .from("loans")
    .select("org_id, customer_id")
    .eq("id", loanId)
    .maybeSingle();

  if (!targetLoan) return { error: "Loan record not found." };

  if (lender.role !== "admin") {
    if (targetLoan.org_id !== lender.org_id) {
      return { error: "Forbidden: You can only reject loans within your assigned organization." };
    }
    if (lender.campus_id) {
      const { data: borrower } = await service
        .from("profiles")
        .select("campus_id")
        .eq("id", targetLoan.customer_id)
        .maybeSingle();

      if (borrower?.campus_id && borrower.campus_id !== lender.campus_id) {
        return { error: "Forbidden: You can only reject loans within your assigned campus." };
      }
    }
  }

  const { data: loan, error } = await service
    .from("loans")
    .update({
      status: "rejected",
      admin_id: lender.id,
      rejection_reason: reason,
      approved_at: new Date().toISOString(),
    })
    .eq("id", loanId)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error || !loan) return { error: error?.message || "Could not reject loan." };

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
      params: { reason },
    });
  }

  await logAuditEntry({
    action: "Reject Loan Request",
    actor_id: lender.id,
    entity_type: "loan",
    entity_id: loan.id,
    details: `Lender ${lender.full_name || lender.email} rejected loan request ${loan.id}. Reason: ${reason}`,
  });

  return { data: loan };
}

export async function uploadDisbursalProof(loanId: string, proofUrl: string) {
  const { lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const service = createServiceRoleClient();
  const now = new Date().toISOString();

  // Tenant isolation check
  const { data: targetLoan } = await service
    .from("loans")
    .select("org_id, customer_id")
    .eq("id", loanId)
    .maybeSingle();

  if (!targetLoan) return { error: "Loan record not found." };

  if (lender.role !== "admin" && targetLoan.org_id !== lender.org_id) {
    return { error: "Forbidden: You can only disburse loans within your assigned organization." };
  }

  const { data: loan, error } = await service
    .from("loans")
    .update({
      disbursal_proof_url: proofUrl,
      status: "active",
      disbursed_at: now,
      active_at: now,
    })
    .eq("id", loanId)
    .select()
    .maybeSingle();

  if (error || !loan) return { error: error?.message || "Could not update disbursal status." };

  try {
    await service.from("loan_payments").insert({
      loan_id: loan.id,
      org_id: lender.org_id,
      borrower_id: loan.customer_id,
      amount: loan.amount,
      payment_proof_url: proofUrl,
      payment_type: "disbursal",
      status: "verified",
    });
  } catch (paymentErr) {
    console.warn("Disbursal payment record notice:", paymentErr);
  }

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

  await logAuditEntry({
    action: "Disburse Loan Funds",
    actor_id: lender.id,
    entity_type: "loan",
    entity_id: loan.id,
    details: `Lender ${lender.full_name || lender.email} uploaded disbursal proof and marked loan ${loan.id} of ${formatINR(loan.amount)} as active.`,
  });

  return { data: loan };
}

export async function sendRepaymentReminder(loanId: string) {
  const { lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const service = createServiceRoleClient();

  const { data: loan } = await service
    .from("loans")
    .select("*")
    .eq("id", loanId)
    .maybeSingle();

  if (!loan) return { error: "Loan not found." };
  if (lender.role !== "admin" && loan.org_id !== lender.org_id) {
    return { error: "Forbidden: You can only send reminders for loans within your organization." };
  }

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

  await logAuditEntry({
    action: "Send Repayment Reminder",
    actor_id: lender.id,
    entity_type: "loan",
    entity_id: loan.id,
    details: `Lender ${lender.full_name || lender.email} sent repayment reminder for active loan ${loan.id} (Total Repayment: ${formatINR(loan.total_repayment)}).`,
  });

  return { success: true };
}

export async function verifyRepaymentAndComplete(loanId: string) {
  const { lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const service = createServiceRoleClient();

  const { data: targetLoan } = await service
    .from("loans")
    .select("org_id, customer_id")
    .eq("id", loanId)
    .maybeSingle();

  if (!targetLoan) return { error: "Loan record not found." };
  if (lender.role !== "admin" && targetLoan.org_id !== lender.org_id) {
    return { error: "Forbidden: You can only complete loans within your organization." };
  }

  const { data: loan, error } = await service
    .from("loans")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", loanId)
    .eq("status", "active")
    .select()
    .maybeSingle();

  if (error || !loan) return { error: error?.message || "Could not complete loan." };

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

  await logAuditEntry({
    action: "Complete Loan Repayment",
    actor_id: lender.id,
    entity_type: "loan",
    entity_id: loan.id,
    details: `Lender ${lender.full_name || lender.email} verified repayment and marked loan ${loan.id} of ${formatINR(loan.total_repayment)} as completed.`,
  });

  return { data: loan };
}
