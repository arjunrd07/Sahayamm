"use server";

import { createClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/notify";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, admin: null };
  const { data: admin } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!admin || admin.role !== "admin") return { supabase, admin: null };
  return { supabase, admin };
}

export async function decideVerification(
  profileId: string,
  approve: boolean,
  rejectionReason?: string
) {
  const { supabase, admin } = await requireAdmin();
  if (!admin) return { error: "Not authorized." };

  const { data: target, error } = await supabase
    .from("profiles")
    .update({
      verification_status: approve ? "verified" : "rejected",
      rejection_reason: approve ? null : rejectionReason || "Not specified",
      verified_by: admin.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("org_id", admin.org_id)
    .select()
    .single();

  if (error || !target) return { error: error?.message || "Could not update verification." };

  await dispatchNotification({
    orgId: admin.org_id,
    userId: target.id,
    userEmail: target.email,
    type: "verification_decision",
    params: { approved: String(approve), orgName: "", reason: rejectionReason || "" },
  });

  return { data: target };
}
