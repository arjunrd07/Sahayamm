"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";

export async function superadminOverrideLoanStatus(loanId: string, newStatus: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: superadmin } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!superadmin || superadmin.role !== "superadmin") {
    return { error: "Superadmin privileges required." };
  }

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
    updatePayload.rejection_reason = reason || "Superadmin override";
  }

  const { data, error } = await service
    .from("loans")
    .update(updatePayload)
    .eq("id", loanId)
    .select()
    .maybeSingle();

  if (error || !data) return { error: error?.message || "Could not update loan status." };

  await logAuditEntry({
    action: "Superadmin Loan Status Override",
    actor_id: user.id,
    entity_type: "loan",
    entity_id: loanId,
    details: `Overrode loan status to "${newStatus}". Amount: ₹${data.amount}. Reason: ${reason || "Superadmin directive"}`,
  });

  return { data };
}

export async function superadminBulkUpdateLoanStatus(loanIds: string[], newStatus: "approved" | "rejected", reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: superadmin } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!superadmin || superadmin.role !== "superadmin") {
    return { error: "Superadmin privileges required." };
  }

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
    updatePayload.rejection_reason = reason || "Bulk Superadmin rejection";
  }

  const { data, error } = await service
    .from("loans")
    .update(updatePayload)
    .in("id", loanIds)
    .select();

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Superadmin Bulk Loan Override",
    actor_id: user.id,
    entity_type: "loan",
    details: `Bulk updated ${loanIds.length} loans to status "${newStatus}"`,
  });

  return { count: data?.length || loanIds.length };
}
