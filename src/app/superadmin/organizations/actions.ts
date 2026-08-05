"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";

export async function createOrganization(name: string, code: string, capitalLimit: number = 2500000) {
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

  if (error || !data) return { error: error?.message || "Could not create organization." };

  await logAuditEntry({
    action: "Create Organization",
    actor_id: user.id,
    entity_type: "organization",
    entity_id: data.id,
    details: `Organization "${name}" (${cleanCode}) registered with pool limit ₹${capitalLimit.toLocaleString()}`,
  });

  return { data };
}

export async function toggleOrganizationStatus(orgId: string, currentStatus: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: superadmin } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!superadmin || superadmin.role !== "superadmin") {
    return { error: "Superadmin privileges required." };
  }

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

  if (error || !data) return { error: error?.message || "Could not update organization status." };

  // If set to inactive, cascade to borrower verification flags as soft protection
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

  await logAuditEntry({
    action: `Soft Delete / Update Org Status`,
    actor_id: user.id,
    entity_type: "organization",
    entity_id: orgId,
    details: `Organization status updated to "${newStatus}"`,
  });

  return { data };
}

export async function updateOrganizationLiquidity(orgId: string, newLimit: number) {
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
  const { data, error } = await service
    .from("organizations")
    .update({
      max_loan_amount: newLimit,
    })
    .eq("id", orgId)
    .select()
    .maybeSingle();

  if (error || !data) return { error: error?.message || "Could not update liquidity limit." };

  await logAuditEntry({
    action: "Update Org Liquidity Pool Limit",
    actor_id: user.id,
    entity_type: "organization",
    entity_id: orgId,
    details: `Capital pool limit updated to ₹${newLimit.toLocaleString()}`,
  });

  return { data };
}

export async function assignUserToOrganization(userId: string, orgId: string) {
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

  if (error || !data) return { error: error?.message || "Could not assign user to organization." };

  await logAuditEntry({
    action: "Assign User to Organization",
    actor_id: user.id,
    entity_type: "user",
    entity_id: userId,
    details: `Assigned user ${data.email} to org ${orgId}`,
  });

  return { data };
}
