"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { logAuditEntry } from "@/lib/audit";
import { sendEmail } from "@/lib/resend";

export interface NotificationPayload {
  targetType: "user" | "organization" | "global";
  targetId?: string;
  title: string;
  message: string;
  type: string;
  sendEmailNotice?: boolean;
}

export async function getAdminNotificationsData() {
  const service = createServiceRoleClient();

  const [{ data: profs }, { data: orgs }, { data: notifs }] = await Promise.all([
    service.from("profiles").select("id, full_name, email, role, org_id, pan_number").order("full_name"),
    service.from("organizations").select("id, name, code").order("name"),
    service
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const profilesMap = new Map((profs || []).map((p: any) => [p.id, p]));

  const enrichedNotifs = (notifs || []).map((n: any) => {
    const userProfile = profilesMap.get(n.user_id);
    return {
      ...n,
      recipient_name: userProfile?.full_name || "Platform Member",
      recipient_email: userProfile?.email || "user@sahayam.internal",
    };
  });

  return {
    profiles: profs || [],
    organizations: orgs || [],
    history: enrichedNotifs,
  };
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
  let targetUsers: { id: string; email: string; full_name?: string; org_id: string | null }[] = [];

  if (payload.targetType === "user" && payload.targetId) {
    const { data: targetUser } = await service
      .from("profiles")
      .select("id, email, full_name, org_id")
      .eq("id", payload.targetId)
      .maybeSingle();

    if (targetUser) {
      targetUsers.push({
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        org_id: targetUser.org_id,
      });
    }
  } else if (payload.targetType === "organization" && payload.targetId) {
    const { data: orgUsers } = await service
      .from("profiles")
      .select("id, email, full_name, org_id")
      .eq("org_id", payload.targetId);

    if (orgUsers) {
      targetUsers = orgUsers.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        org_id: u.org_id,
      }));
    }
  } else {
    // Global notification
    const { data: allUsers } = await service.from("profiles").select("id, email, full_name, org_id");
    if (allUsers) {
      targetUsers = allUsers.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        org_id: u.org_id,
      }));
    }
  }

  if (targetUsers.length === 0) {
    return { count: 0, error: "No matching recipient users found." };
  }

  // Insert in-app notifications
  const rowsToInsert = targetUsers.map((u) => ({
    org_id: u.org_id || fallbackOrgId,
    user_id: u.id,
    title: payload.title.trim(),
    message: payload.message.trim(),
    type: payload.type || "global_broadcast",
    read: false,
    email_sent: payload.sendEmailNotice !== false,
  }));

  const { error } = await service.from("notifications").insert(rowsToInsert);

  if (error) {
    console.warn("Notice inserting notifications:", error.message);
  }

  // Dispatch real email notifications to all target recipients
  if (payload.sendEmailNotice !== false) {
    for (const u of targetUsers) {
      if (u.email && u.email.includes("@")) {
        try {
          await sendEmail({
            to: u.email,
            type: "verification_decision",
            subject: `[Sahayam] ${payload.title.trim()}`,
            body: `${payload.message.trim()}\n\n---\nSahayam Peer-to-Peer Internal Lending Platform`,
          });
        } catch (mailErr) {
          console.warn(`Email delivery notice to ${u.email}:`, mailErr);
        }
      }
    }
  }

  await logAuditEntry({
    action: "Notification Broadcast & Email Dispatch",
    actor_id: "admin",
    entity_type: "system",
    details: `Sent notification "${payload.title}" and email notice to ${targetUsers.length} target users (${payload.targetType})`,
  });

  return { count: targetUsers.length };
}
