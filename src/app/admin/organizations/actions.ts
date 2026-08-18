"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";

export async function createOrganization(name: string, code: string, capitalLimit: number = 2500000) {
  const service = createServiceRoleClient();
  const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

  const { data, error } = await service
    .from("organizations")
    .insert({
      name: name.trim(),
      code: cleanCode,
      max_loan_amount: capitalLimit,
      status: "active",
    })
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Create Organization",
    actor_id: "admin",
    entity_type: "organization",
    entity_id: data?.id || cleanCode,
    details: `Organization "${name}" (${cleanCode}) registered with pool limit ₹${capitalLimit.toLocaleString()}`,
  });

  return { data: data || { id: cleanCode, name: name.trim(), code: cleanCode, max_loan_amount: capitalLimit, status: "active" } };
}

export async function toggleOrganizationStatus(orgId: string, currentStatus: string) {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  const service = createServiceRoleClient();

  const { data, error } = await service
    .from("organizations")
    .update({
      status: newStatus,
    })
    .eq("id", orgId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  try {
    if (newStatus === "inactive") {
      await service
        .from("profiles")
        .update({ verification_status: "rejected", rejection_reason: "Parent organization deactivated" })
        .eq("org_id", orgId)
        .eq("role", "borrower");
    } else {
      await service
        .from("profiles")
        .update({ verification_status: "verified", rejection_reason: null })
        .eq("org_id", orgId)
        .eq("role", "borrower");
    }
  } catch (err) {
    console.warn("Cascade status update notice:", err);
  }

  await logAuditEntry({
    action: `Soft Delete / Update Org Status`,
    actor_id: "admin",
    entity_type: "organization",
    entity_id: orgId,
    details: `Organization status updated to "${newStatus}"`,
  });

  return { data: data || { id: orgId, status: newStatus } };
}

export async function updateOrganizationLiquidity(orgId: string, newLimit: number) {
  const service = createServiceRoleClient();
  const { data, error } = await service
    .from("organizations")
    .update({
      max_loan_amount: newLimit,
    })
    .eq("id", orgId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Update Org Liquidity Pool Limit",
    actor_id: "admin",
    entity_type: "organization",
    entity_id: orgId,
    details: `Capital pool limit updated to ₹${newLimit.toLocaleString()}`,
  });

  return { data: data || { id: orgId, max_loan_amount: newLimit } };
}

export async function assignUserToOrganization(userId: string, orgId: string) {
  const service = createServiceRoleClient();
  const { data, error } = await service
    .from("profiles")
    .update({
      org_id: orgId,
      organization_id: orgId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Assign User to Organization",
    actor_id: "admin",
    entity_type: "user",
    entity_id: userId,
    details: `Assigned user ${userId} to org ${orgId}`,
  });

  return { data: data || { id: userId, org_id: orgId } };
}
