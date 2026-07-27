"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function toggleUserAccess(userId: string, currentStatus: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: superadmin } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!superadmin || superadmin.role !== "superadmin") {
    return { error: "Superadmin privileges required." };
  }

  const service = createServiceRoleClient();
  const newStatus = currentStatus === "rejected" ? "verified" : "rejected";

  const { data, error } = await service
    .from("profiles")
    .update({
      verification_status: newStatus,
      rejection_reason: newStatus === "rejected" ? "Access revoked by Superadmin" : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error || !data) return { error: error?.message || "Could not update user access." };

  return { data };
}
