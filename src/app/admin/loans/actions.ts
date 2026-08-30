"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";

export async function getAdminLoansData() {
  const service = createServiceRoleClient();

  const [
    { data: loansData },
    { data: orgsData },
    { data: campusesData },
    { data: profilesData },
    { data: agreementsData },
  ] = await Promise.all([
    service.from("loans").select("*").order("created_at", { ascending: false }),
    service.from("organizations").select("*").order("name"),
    service.from("campuses").select("*").order("name"),
    service.from("profiles").select("*"),
    service.from("agreements").select("*"),
  ]);

  return {
    loans: loansData || [],
    organizations: orgsData || [],
    campuses: campusesData || [],
    profiles: profilesData || [],
    agreements: agreementsData || [],
  };
}

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
    action: `Bulk Loan ${newStatus.toUpperCase()}`,
    actor_id: "admin",
    entity_type: "loan",
    entity_id: `bulk-${loanIds.length}`,
    details: `Bulk marked ${loanIds.length} loans as "${newStatus}". IDs: ${loanIds.join(", ")}. Reason: ${reason || "Admin batch decision"}`,
  });

  return { data: data || [] };
}
