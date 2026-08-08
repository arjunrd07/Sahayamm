"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";
import type { UserRole } from "@/types/database";

export async function toggleUserAccess(userId: string, targetStatusOrCurrentStatus: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: adminUser } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!adminUser || (adminUser.role !== "superadmin" && adminUser.role !== "admin")) {
    return { error: "Admin privileges required." };
  }

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

  if (error || !data) return { error: error?.message || "Could not update user access." };

  // Also sync to borrowers table if user is borrower
  if (data.role === "borrower" || (data.role as string) === "customer") {
    await service
      .from("borrowers")
      .update({
        verification_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  await logAuditEntry({
    action: newStatus === "rejected" ? "Revoke User Access" : "Restore User Access",
    actor_id: user.id,
    entity_type: "user",
    entity_id: userId,
    details: `User access status updated to "${newStatus}" for ${data.email}. Reason: ${reason || "Admin directive"}`,
  });

  return { data };
}

export async function updateUserRoleAndOrg(
  userId: string,
  newRole: UserRole,
  orgId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: adminUser } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!adminUser || (adminUser.role !== "superadmin" && adminUser.role !== "admin")) {
    return { error: "Admin privileges required." };
  }

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

  if (error || !data) return { error: error?.message || "Could not update user role and org." };

  await logAuditEntry({
    action: "Update User Role & Organization",
    actor_id: user.id,
    entity_type: "user",
    entity_id: userId,
    details: `Updated user ${data.email} role to ${newRole}, orgId to ${orgId || "N/A"}`,
  });

  return { data };
}

export async function purgeUserAccount(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: adminUser } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!adminUser || (adminUser.role !== "superadmin" && adminUser.role !== "admin")) {
    return { error: "Admin privileges required." };
  }

  const service = createServiceRoleClient();

  // Delete profile first then auth user
  const { data: profile } = await service.from("profiles").select("email").eq("id", userId).maybeSingle();
  await service.from("profiles").delete().eq("id", userId);
  await service.auth.admin.deleteUser(userId);

  await logAuditEntry({
    action: "Purge User Account",
    actor_id: user.id,
    entity_type: "user",
    entity_id: userId,
    details: `Permanently purged user account ${profile?.email || userId}`,
  });

  return { success: true };
}
