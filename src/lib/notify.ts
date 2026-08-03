import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail, notificationCopy } from "@/lib/resend";
import type { NotificationType } from "@/types/database";

export interface DispatchNotificationInput {
  orgId: string;
  userId: string;
  userEmail: string;
  loanId?: string;
  type: NotificationType;
  params: Record<string, string>;
}

/**
 * Writes the in-app notification row and sends the matching email in
 * one call. Used from Server Actions / Route Handlers after a
 * state-changing operation (approval, agreement ready, funds sent, etc).
 */
export async function dispatchNotification(input: DispatchNotificationInput) {
  const { title, message } = notificationCopy[input.type](input.params);
  const supabase = createServiceRoleClient();

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert({
      org_id: input.orgId,
      user_id: input.userId,
      loan_id: input.loanId ?? null,
      title,
      message,
      type: input.type,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error("Failed to write notification:", error.message);
  }

  const emailResult = await sendEmail({
    to: input.userEmail,
    type: input.type,
    subject: title,
    body: message,
  });

  if (emailResult.sent && notification) {
    await supabase.from("notifications").update({ email_sent: true }).eq("id", notification.id);
  }

  return { notification, emailResult };
}
