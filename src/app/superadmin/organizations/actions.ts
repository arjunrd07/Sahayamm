"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function createOrganization(name: string, code: string) {
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
    })
    .select()
    .maybeSingle();

  if (error || !data) return { error: error?.message || "Could not create organization." };

  return { data };
}

export async function revokeOrganization(orgId: string) {
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
  const { error } = await service.from("organizations").delete().eq("id", orgId);

  if (error) return { error: error.message };

  return { success: true };
}
