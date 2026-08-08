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

  const { data: adminUser } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!adminUser || (adminUser.role !== "superadmin" && adminUser.role !== "admin")) {
    return { error: "Admin privileges required." };
  }

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
    return { error: "No target users found." };
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
    return { error: error.message };
  }

  await logAuditEntry({
    action: "Manual Notification Broadcast",
    actor_id: user.id,
    entity_type: "system",
    details: `Sent notification "${payload.title}" to ${targetUserIds.length} target users (${payload.targetType})`,
  });

  return { count: targetUserIds.length };
}
