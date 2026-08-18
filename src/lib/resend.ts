import type { NotificationType } from "@/types/database";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export interface SendEmailInput {
  to: string;
  type: NotificationType;
  subject: string;
  body: string; // plain text; wrapped in a minimal HTML shell below
}

export interface SendEmailResult {
  sent: boolean;
  mock: boolean;
  id?: string;
}

/**
 * Sends a transactional email via Resend.
 * When RESEND_API_KEY is not set or custom domain is not verified, 
 * falls back to Resend's standard test domain (onboarding@resend.dev) or mock output.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Sahayam <onboarding@resend.dev>";
  const html = renderEmail(input.subject, input.body);

  if (!apiKey) {
    console.log(`[mock-email] to=${input.to} subject="${input.subject}"\n${input.body}`);
    return { sent: true, mock: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.to],
        subject: input.subject,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Resend API notice (${res.status}): ${errText}`);

      // If domain unverified (403), retry once with official Resend test domain
      if (res.status === 403 && fromEmail !== "Sahayam <onboarding@resend.dev>") {
        console.log("Retrying email dispatch with default Resend sender (onboarding@resend.dev)...");
        const retryRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Sahayam <onboarding@resend.dev>",
            to: [input.to],
            subject: input.subject,
            html,
          }),
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json();
          return { sent: true, mock: false, id: retryData?.id };
        }
      }

      console.log(`[mock-email fallback] to=${input.to} subject="${input.subject}"\n${input.body}`);
      return { sent: true, mock: true };
    }

    const data = await res.json();
    return { sent: true, mock: false, id: data?.id };
  } catch (err) {
    console.warn("Resend email dispatch error:", err);
    console.log(`[mock-email fallback] to=${input.to} subject="${input.subject}"\n${input.body}`);
    return { sent: true, mock: true };
  }
}

function renderEmail(subject: string, body: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0B0D12;">
      <div style="font-weight: 700; font-size: 18px; margin-bottom: 24px;">Sahayam</div>
      <div style="font-weight: 600; font-size: 16px; margin-bottom: 12px;">${subject}</div>
      <div style="font-size: 14px; line-height: 1.6; color: #3A3F4B; white-space: pre-line;">${body}</div>
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #E4E6EB; font-size: 12px; color: #6B7280;">
        This is an automated message from your organization's internal lending platform. Sahayam does not hold, transfer, or process funds.
      </div>
    </div>
  `;
}

/** Copy for each notification type — kept centralized for consistency across in-app + email. */
export const notificationCopy: Record<
  NotificationType,
  (params: Record<string, string>) => { title: string; message: string }
> = {
  verification_decision: (p) => ({
    title: p.approved === "true" ? "Verification approved" : "Verification rejected",
    message:
      p.approved === "true"
        ? `You're verified with ${p.orgName}. You can now request a loan.`
        : `Your verification was rejected. Reason: ${p.reason || "Not specified"}.`,
  }),
  loan_requested: (p) => {
    const isBorrower = p.isBorrower === "true";
    return {
      title: isBorrower ? "Request Submitted" : "New loan request",
      message: isBorrower
        ? `Your loan request of ${p.amount} is currently under pending review.`
        : `${p.customerName} requested ${p.amount} for "${p.purpose}".`,
    };
  },
  loan_approved: (p) => ({
    title: "Loan approved",
    message: `Your request for ${p.amount} was approved. Agreement is being prepared.`,
  }),
  loan_rejected: (p) => ({
    title: "Loan rejected",
    message: `Your request for ${p.amount} was rejected. Reason: ${p.reason || "Not specified"}.`,
  }),
  agreement_ready: (p) => ({
    title: "Agreement ready to sign",
    message: `Agreement ${p.agreementNumber} is ready for signature.`,
  }),
  agreement_signed: (p) => ({
    title: "Agreement signed",
    message: p.signerRole
      ? `Agreement ${p.agreementNumber} was signed by ${p.signerRole}.`
      : `Agreement ${p.agreementNumber} has been fully signed by both parties.`,
  }),
  funds_sent: (p) => ({
    title: "Funds sent",
    message: `${p.amount} has been sent. Your loan is now active. Due ${p.dueDate}.`,
  }),
  repayment_reminder: (p) => ({
    title: "Repayment due soon",
    message: `Your repayment of ${p.amount} is due on ${p.dueDate}.`,
  }),
  loan_completed: (p) => ({
    title: "Loan completed",
    message: `Your loan of ${p.amount} has been marked completed. Thank you.`,
  }),
  loan_overdue: (p) => ({
    title: "Loan overdue",
    message: `Repayment of ${p.amount} was due on ${p.dueDate} and is now overdue.`,
  }),
};
