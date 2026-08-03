"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function toggleUserAccess(userId: string, currentStatus: string) {
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

  return { data };
}

export async function updateUserRole(userId: string, newRole: "borrower" | "lender" | "superadmin") {
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
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .maybeSingle();

  if (error || !data) return { error: error?.message || "Could not update user role." };

  if (newRole === "borrower") {
    await service.from("borrowers").upsert({
      id: data.id,
      organization_id: data.org_id,
      full_name: data.full_name || "Borrower",
      email: data.email || "",
      phone: data.phone,
      verification_status: data.verification_status,
      updated_at: new Date().toISOString(),
    });
  }

  return { data };
}
