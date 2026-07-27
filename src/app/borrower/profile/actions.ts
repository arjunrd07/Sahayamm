"use server";

import { createClient } from "@/lib/supabase/server";

export async function notifyProfileUpdated(profileId: string, orgId: string, name: string) {
  try {
    const supabase = await createClient();
    await supabase.from("notifications").insert({
      org_id: orgId,
      user_id: profileId,
      title: "Profile & KYC Details Updated",
      message: `Profile identity and financial KYC credentials for ${name} were successfully updated in the workspace.`,
      type: "verification_decision",
      read: false,
    });
    return { success: true };
  } catch (err: any) {
    console.error("Failed to insert profile update notification:", err);
    return { error: err?.message };
  }
}
