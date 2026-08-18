"use server";

import { createServiceRoleClient, createMasterServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";
import type { UserRole } from "@/types/database";

export async function toggleUserAccess(userId: string, targetStatusOrCurrentStatus: string, reason?: string) {
  const serviceMaster = createMasterServiceRoleClient();
  const servicePublic = createServiceRoleClient();
  const serviceOrg = createServiceRoleClient("org_rmse_waverock");

  const newStatus = (targetStatusOrCurrentStatus === "verified" || targetStatusOrCurrentStatus === "rejected")
    ? targetStatusOrCurrentStatus
    : (targetStatusOrCurrentStatus === "rejected" ? "verified" : "rejected");

  const updatePayload = {
    verification_status: newStatus,
    rejection_reason: newStatus === "rejected" ? reason || "Access revoked by Admin" : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await serviceMaster
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  // Sync status across public and org schemas
  try {
    await servicePublic.from("profiles").update(updatePayload).eq("id", userId);
    await serviceOrg.from("profiles").update(updatePayload).eq("id", userId);
  } catch (err) {
    console.warn("Sync profile status notice:", err);
  }

  // Also sync to borrowers table if user is borrower
  try {
    const borrowerPayload = {
      verification_status: newStatus,
      updated_at: new Date().toISOString(),
    };
    await serviceMaster.from("borrowers").update(borrowerPayload).eq("id", userId);
    await servicePublic.from("borrowers").update(borrowerPayload).eq("id", userId);
    await serviceOrg.from("borrowers").update(borrowerPayload).eq("id", userId);
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
  const serviceMaster = createMasterServiceRoleClient();
  const servicePublic = createServiceRoleClient();
  const serviceOrg = createServiceRoleClient("org_rmse_waverock");

  const updatePayload: any = {
    role: newRole,
    updated_at: new Date().toISOString(),
  };

  if (newRole === "admin") {
    updatePayload.verification_status = "verified";
  }

  if (orgId !== undefined) {
    updatePayload.org_id = orgId || null;
    updatePayload.organization_id = orgId || null;
  }

  // 1. Update master_db.profiles
  const { data, error } = await serviceMaster
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  // 2. Update public.profiles
  try {
    await servicePublic.from("profiles").update(updatePayload).eq("id", userId);
  } catch (err) {
    console.warn("Public profile update notice:", err);
  }

  // 3. Update org_rmse_waverock.profiles
  try {
    await serviceOrg.from("profiles").update(updatePayload).eq("id", userId);
  } catch (err) {
    console.warn("Org profile update notice:", err);
  }

  // 4. Update auth.users metadata so JWT session reflects new role
  try {
    await servicePublic.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole },
    });
  } catch (authErr) {
    console.warn("Notice updating auth user metadata:", authErr);
  }

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
  const serviceMaster = createMasterServiceRoleClient();
  const servicePublic = createServiceRoleClient();
  const serviceOrg = createServiceRoleClient("org_rmse_waverock");

  const { data: profile } = await serviceMaster.from("profiles").select("email").eq("id", userId).maybeSingle();

  // Delete profile from all schemas
  try {
    await serviceMaster.from("profiles").delete().eq("id", userId);
    await servicePublic.from("profiles").delete().eq("id", userId);
    await serviceOrg.from("profiles").delete().eq("id", userId);
  } catch (e) {
    console.warn("Notice deleting profiles:", e);
  }

  // Delete from auth.users
  try {
    await servicePublic.auth.admin.deleteUser(userId);
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
