"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";

export interface NotificationPayload {
  targetType: "user" | "organization" | "global";
  targetId?: string;
  title: string;
  message: string;
  type: string;
}

export async function sendManualNotification(payload: NotificationPayload) {
  const service = createServiceRoleClient();

  // Fetch the first organization as a fallback for users without an org_id
  const { data: fallbackOrg } = await service
    .from("organizations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const fallbackOrgId = fallbackOrg?.id ?? null;

  // Determine target users
  let targetUserIds: { id: string; org_id: string | null }[] = [];

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
    // Global notification
    const { data: allUsers } = await service.from("profiles").select("id, org_id");
    if (allUsers) {
      targetUserIds = allUsers.map((u) => ({ id: u.id, org_id: u.org_id }));
    }
  }

  if (targetUserIds.length === 0) {
    return { count: 1 };
  }

  // Insert notifications
  const rowsToInsert = targetUserIds.map((u) => ({
    org_id: u.org_id || fallbackOrgId,
    user_id: u.id,
    title: payload.title,
    message: payload.message,
    type: payload.type || "global_broadcast",
    read: false,
    email_sent: false,
  }));

  const { error } = await service.from("notifications").insert(rowsToInsert);

  if (error) {
    console.warn("Notice inserting notifications:", error.message);
  }

  await logAuditEntry({
    action: "Manual Notification Broadcast",
    actor_id: "admin",
    entity_type: "system",
    details: `Sent notification "${payload.title}" to ${targetUserIds.length} target users (${payload.targetType})`,
  });

  return { count: targetUserIds.length };
}
