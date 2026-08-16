"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";
import type { UserRole } from "@/types/database";

export async function toggleUserAccess(userId: string, targetStatusOrCurrentStatus: string, reason?: string) {
  const service = createServiceRoleClient();
  const newStatus = (targetStatusOrCurrentStatus === "verified" || targetStatusOrCurrentStatus === "rejected")
    ? targetStatusOrCurrentStatus
    : (targetStatusOrCurrentStatus === "rejected" ? "verified" : "rejected");

  const { data, error } = await service
    .from("profiles")
    .update({
      verification_status: newStatus,
      rejection_reason: newStatus === "rejected" ? reason || "Access revoked by Admin" : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  // Also sync to borrowers table if user is borrower
  try {
    await service
      .from("borrowers")
      .update({
        verification_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  } catch (err) {
    console.warn("Sync to borrowers table notice:", err);
  }

  await logAuditEntry({
    action: newStatus === "rejected" ? "Revoke User Access" : "Restore User Access",
    actor_id: "admin",
    entity_type: "user",
    entity_id: userId,
    details: `User access status updated to "${newStatus}" for user ${userId}. Reason: ${reason || "Admin directive"}`,
  });

  return { data: data || { id: userId, verification_status: newStatus } };
}

export async function updateUserRoleAndOrg(
  userId: string,
  newRole: UserRole,
  orgId?: string
) {
  const service = createServiceRoleClient();
  const updatePayload: any = {
    role: newRole,
    updated_at: new Date().toISOString(),
  };

  if (orgId !== undefined) {
    updatePayload.org_id = orgId || null;
    updatePayload.organization_id = orgId || null;
  }

  const { data, error } = await service
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  await logAuditEntry({
    action: "Update User Role & Organization",
    actor_id: "admin",
    entity_type: "user",
    entity_id: userId,
    details: `Updated user ${userId} role to ${newRole}, orgId to ${orgId || "N/A"}`,
  });

  return { data: data || { id: userId, role: newRole, org_id: orgId } };
}

export async function purgeUserAccount(userId: string) {
  const service = createServiceRoleClient();

  const { data: profile } = await service.from("profiles").select("email").eq("id", userId).maybeSingle();
  await service.from("profiles").delete().eq("id", userId);
  try {
    await service.auth.admin.deleteUser(userId);
  } catch (err) {
    console.warn("Notice deleting auth user:", err);
  }

  await logAuditEntry({
    action: "Purge User Account",
    actor_id: "admin",
    entity_type: "user",
    entity_id: userId,
    details: `Permanently purged user account ${profile?.email || userId}`,
  });

  return { success: true };
}
