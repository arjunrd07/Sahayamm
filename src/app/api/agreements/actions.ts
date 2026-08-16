"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/notify";
import { logAuditEntry } from "@/lib/audit";

export async function signLendingAgreement(agreementId: string, signatureName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Authentication required to sign agreement." };
  }

  if (!signatureName || !signatureName.trim()) {
    return { error: "Legal signature name is required." };
  }

  const service = createServiceRoleClient();
  const { data: agreement } = await service
    .from("agreements")
    .select("*, loan:loans(*)")
    .eq("id", agreementId)
    .maybeSingle();

  if (!agreement) {
    return { error: "Lending agreement not found." };
  }

  const loan = (agreement as any).loan;
  const isBorrower = loan?.customer_id === user.id;
  const isLender = loan?.admin_id === user.id || user.user_metadata?.role === "lender" || user.user_metadata?.role === "superadmin";

  if (!isBorrower && !isLender) {
    return { error: "You are not an authorized party for this agreement." };
  }

  const now = new Date().toISOString();
  const patch: Record<string, any> = {};

  if (isBorrower) {
    patch.borrower_signed = true;
    patch.borrower_signed_at = now;
  }

  if (isLender) {
    patch.lender_signed = true;
    patch.lender_signed_at = now;
  }

  const willBeCompleted =
    (isBorrower && agreement.lender_signed) ||
    (isLender && agreement.borrower_signed) ||
    (agreement.borrower_signed && agreement.lender_signed);

  patch.status = willBeCompleted ? "completed" : "partially_signed";
  patch.updated_at = now;

  const { data: updated, error } = await service
    .from("agreements")
    .update(patch)
    .eq("id", agreementId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  const signerRole = isBorrower ? "Borrower" : "Lender";

  // Dispatch Notification
  const recipientId = isBorrower ? loan?.admin_id : loan?.customer_id;
  if (recipientId) {
    const { data: recipientProfile } = await service
      .from("profiles")
      .select("email")
      .eq("id", recipientId)
      .maybeSingle();

    if (recipientProfile?.email) {
      await dispatchNotification({
        orgId: agreement.org_id,
        userId: recipientId,
        userEmail: recipientProfile.email,
        loanId: agreement.loan_id,
        type: "agreement_signed",
        params: { agreementNumber: agreement.agreement_number, signerRole },
      });
    }
  }

  // Log Audit Entry
  await logAuditEntry({
    action: "Sign Lending Agreement (Sahayam Native Seal)",
    actor_id: user.id,
    entity_type: "agreement",
    entity_id: agreement.id,
    details: `${signerRole} (${signatureName.trim()}) executed digital signature for agreement ${agreement.agreement_number}. Status: ${patch.status}.`,
  });

  return { data: updated, status: patch.status };
}
