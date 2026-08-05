"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";

export interface NotificationPayload {
  targetType: "user" | "organization" | "global";
  targetId?: string;
  title: string;
  message: string;
  type: string;
}

export async function sendManualNotification(payload: NotificationPayload) {
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

  // Determine target users
  let targetUserIds: { id: string; org_id: string }[] = [];

  if (payload.targetType === "user" && payload.targetId) {
    const { data: targetUser } = await service
      .from("profiles")
      .select("id, org_id")
      .eq("id", payload.targetId)
      .maybeSingle();

    if (targetUser) {
      targetUserIds.push({ id: targetUser.id, org_id: targetUser.org_id });
    }
  } else if (payload.targetType === "organization" && payload.targetId) {
    const { data: orgUsers } = await service
      .from("profiles")
      .select("id, org_id")
      .eq("org_id", payload.targetId);

    if (orgUsers) {
      targetUserIds = orgUsers.map((u) => ({ id: u.id, org_id: u.org_id }));
    }
  } else {
    // Global broadcast to all profiles
    const { data: allUsers } = await service.from("profiles").select("id, org_id");
    if (allUsers) {
      targetUserIds = allUsers.map((u) => ({ id: u.id, org_id: u.org_id }));
    }
  }

  if (targetUserIds.length === 0) {
    return { error: "No target users found for notification broadcast." };
  }

  const notificationRows = targetUserIds.map((u) => ({
    user_id: u.id,
    org_id: u.org_id || "00000000-0000-0000-0000-000000000001",
    title: payload.title.trim(),
    message: payload.message.trim(),
    type: payload.type || "verification_decision",
    read: false,
    email_sent: false,
    created_at: new Date().toISOString(),
  }));

  const { error } = await service.from("notifications").insert(notificationRows);

  if (error) {
    console.error("Error inserting notifications:", error);
    return { error: error.message };
  }

  await logAuditEntry({
    action: "Send Manual Notification",
    actor_id: user.id,
    entity_type: "system",
    details: `Broadcasted notification "${payload.title}" to ${targetUserIds.length} users (Target: ${payload.targetType})`,
  });

  return { success: true, count: targetUserIds.length };
}
