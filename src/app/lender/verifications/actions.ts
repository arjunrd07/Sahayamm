"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/notify";

async function requireLender() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, lender: null };
  const { data: lender } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (
    !lender ||
    (lender.role !== "lender" && lender.role !== "admin" && lender.role !== "superadmin")
  ) {
    return { supabase, lender: null };
  }
  return { supabase, lender };
}

export async function decideVerification(
  profileId: string,
  approve: boolean,
  rejectionReason?: string
) {
  const { supabase, lender } = await requireLender();
  if (!lender) return { error: "Not authorized." };

  const newStatus = approve ? "verified" : "rejected";

  const { data: target, error } = await supabase
    .from("profiles")
    .update({
      verification_status: newStatus,
      rejection_reason: approve ? null : rejectionReason || "Not specified",
      verified_by: lender.id,
      verified_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("org_id", lender.org_id)
    .select()
    .maybeSingle();

  if (error || !target) return { error: error?.message || "Could not update verification." };

  // Sync to borrowers table
  const service = createServiceRoleClient();
  await service
    .from("borrowers")
    .update({
      verification_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId);

  await dispatchNotification({
    orgId: lender.org_id,
    userId: target.id,
    userEmail: target.email,
    type: "verification_decision",
    params: { approved: String(approve), orgName: "", reason: rejectionReason || "" },
  });

  return { data: target };
}
