"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";

export async function adminOverrideLoanStatus(loanId: string, newStatus: string, reason?: string) {
  const service = createServiceRoleClient();
  const updatePayload: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "approved") {
    updatePayload.approved_at = new Date().toISOString();
  } else if (newStatus === "active") {
    updatePayload.active_at = new Date().toISOString();
    updatePayload.disbursed_at = new Date().toISOString();
  } else if (newStatus === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  } else if (newStatus === "rejected") {
    updatePayload.rejection_reason = reason || "Admin override";
  }

  const { data, error } = await service
    .from("loans")
    .update(updatePayload)
    .eq("id", loanId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Admin Loan Status Override",
    actor_id: "admin",
    entity_type: "loan",
    entity_id: loanId,
    details: `Overrode loan status to "${newStatus}". Loan ID: ${loanId}. Reason: ${reason || "Admin directive"}`,
  });

  return { data: data || { id: loanId, status: newStatus } };
}

export async function adminBulkUpdateLoanStatus(loanIds: string[], newStatus: "approved" | "rejected", reason?: string) {
  if (!loanIds || loanIds.length === 0) {
    return { error: "No loans selected for bulk action." };
  }

  const service = createServiceRoleClient();
  const updatePayload: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "approved") {
    updatePayload.approved_at = new Date().toISOString();
  } else if (newStatus === "rejected") {
    updatePayload.rejection_reason = reason || "Bulk Admin rejection";
  }

  const { data, error } = await service
    .from("loans")
    .update(updatePayload)
    .in("id", loanIds)
    .select();

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Admin Bulk Loan Override",
    actor_id: "admin",
    entity_type: "loan",
    details: `Bulk updated ${loanIds.length} loans to status "${newStatus}"`,
  });

  return { count: data?.length || loanIds.length };
}
