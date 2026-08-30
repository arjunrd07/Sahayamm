"use server";

import { createServiceRoleClient, createMasterServiceRoleClient, createClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";
import type { UserRole, Profile, Organization, Campus } from "@/types/database";

export async function getAdminUsersData() {
  const service = createServiceRoleClient();

  const [{ data: profiles }, { data: orgsData }, { data: campusesData }] = await Promise.all([
    service.from("profiles").select("*").order("created_at", { ascending: false }),
    service.from("organizations").select("*").order("name"),
    service.from("campuses").select("*").order("name"),
  ]);

  return {
    profiles: (profiles as Profile[]) || [],
    organizations: (orgsData as Organization[]) || [],
    campuses: (campusesData as Campus[]) || [],
  };
}

export async function toggleUserAccess(userId: string, targetStatusOrCurrentStatus: string, reason?: string) {
  const serviceMaster = createMasterServiceRoleClient();
  const servicePublic = createServiceRoleClient();

  const newStatus = (targetStatusOrCurrentStatus === "verified" || targetStatusOrCurrentStatus === "rejected")
    ? targetStatusOrCurrentStatus
    : (targetStatusOrCurrentStatus === "rejected" ? "verified" : "rejected");

  const updatePayload = {
    verification_status: newStatus,
    rejection_reason: newStatus === "rejected" ? reason || "Access revoked/paused by Admin" : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await serviceMaster
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  try {
    await servicePublic.from("profiles").update(updatePayload).eq("id", userId);
  } catch (err) {
    console.warn("Sync profile status notice:", err);
  }

  try {
    const borrowerPayload = {
      verification_status: newStatus,
      updated_at: new Date().toISOString(),
    };
    await serviceMaster.from("borrowers").update(borrowerPayload).eq("id", userId);
    await servicePublic.from("borrowers").update(borrowerPayload).eq("id", userId);
  } catch (err) {
    console.warn("Sync to borrowers table notice:", err);
  }

  await logAuditEntry({
    action: newStatus === "rejected" ? "Pause / Revoke User Access" : "Restore User Access",
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
  orgId?: string,
  campusId?: string
) {
  const serviceMaster = createMasterServiceRoleClient();
  const servicePublic = createServiceRoleClient();

  const updatePayload: any = {
    role: newRole,
    updated_at: new Date().toISOString(),
  };

  if (newRole === "admin" || newRole === "lender") {
    updatePayload.verification_status = "verified";
  }

  if (orgId !== undefined) {
    updatePayload.org_id = orgId || null;
  }

  if (campusId !== undefined) {
    updatePayload.campus_id = campusId || null;
  }

  const { data, error } = await serviceMaster
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };

  try {
    await servicePublic.from("profiles").update(updatePayload).eq("id", userId);
  } catch (err) {
    console.warn("Public profile update notice:", err);
  }

  await logAuditEntry({
    action: "Update User Role & Assignment",
    actor_id: "admin",
    entity_type: "user",
    entity_id: userId,
    details: `Role updated to "${newRole}", org_id: "${orgId || 'unassigned'}", campus_id: "${campusId || 'unassigned'}"`,
  });

  return { data: data || { id: userId, role: newRole, org_id: orgId, campus_id: campusId } };
}

export async function purgeUserAccount(userId: string) {
  const serviceMaster = createMasterServiceRoleClient();
  const servicePublic = createServiceRoleClient();

  // 1. Delete associated records from application tables
  try {
    await serviceMaster.from("agreements").delete().eq("borrower_id", userId);
    await serviceMaster.from("agreements").delete().eq("lender_id", userId);
  } catch (err) {
    console.warn("Agreement purge notice:", err);
  }

  try {
    await serviceMaster.from("loans").delete().eq("customer_id", userId);
  } catch (err) {
    console.warn("Loan purge notice:", err);
  }

  try {
    await serviceMaster.from("borrowers").delete().eq("id", userId);
  } catch (err) {
    console.warn("Borrower purge notice:", err);
  }

  try {
    await serviceMaster.from("profiles").delete().eq("id", userId);
    await servicePublic.from("profiles").delete().eq("id", userId);
  } catch (err) {
    console.warn("Profile purge notice:", err);
  }

  // 2. Delete user from auth.users
  try {
    await serviceMaster.auth.admin.deleteUser(userId);
  } catch (authErr) {
    console.warn("Auth user deletion notice:", authErr);
  }

  await logAuditEntry({
    action: "Purge / Delete User Account",
    actor_id: "admin",
    entity_type: "user",
    entity_id: userId,
    details: `User account ${userId} permanently purged and wiped by platform admin.`,
  });

  return { success: true };
}
