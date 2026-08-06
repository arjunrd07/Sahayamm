import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/notify";
import { logAuditEntry } from "@/lib/audit";

/**
 * Configure this URL as the DocuSeal webhook endpoint for the template
 * used by createLendingAgreement(). Handles submitter.completed and
 * submission.completed events to keep signature status and the final
 * signed PDF in sync.
 */
export async function POST(request: Request) {
  const payload = await request.json();
  const eventType = payload?.event_type as string | undefined;
  const submissionId = String(payload?.data?.submission_id ?? payload?.data?.id ?? "");

  if (!submissionId) {
    return NextResponse.json({ error: "Missing submission id" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: agreement } = await supabase
    .from("agreements")
    .select("*, loan:loans(customer_id, org_id, admin_id)")
    .eq("docuseal_submission_id", submissionId)
    .maybeSingle();

  if (!agreement) {
    return NextResponse.json({ error: "Unknown submission" }, { status: 404 });
  }

  if (eventType === "submitter.completed") {
    const role = payload?.data?.role as string | undefined;
    const patch: Record<string, unknown> = {};
    if (role === "Borrower") {
      patch.borrower_signed = true;
      patch.borrower_signed_at = new Date().toISOString();
    } else if (role === "Lender") {
      patch.lender_signed = true;
      patch.lender_signed_at = new Date().toISOString();
    }
    patch.status = "partially_signed";
    await supabase.from("agreements").update(patch).eq("id", agreement.id);

    const loan = (agreement as any).loan;
    await logAuditEntry({
      action: "Sign Lending Agreement",
      actor_id: role === "Borrower" ? loan?.customer_id : loan?.admin_id,
      entity_type: "agreement",
      entity_id: agreement.id,
      details: `${role} signed lending agreement ${agreement.agreement_number} for loan ${agreement.loan_id}.`,
    });
  }

  if (eventType === "submission.completed") {
    const pdfUrl = payload?.data?.documents?.[0]?.url ?? null;
    await supabase
      .from("agreements")
      .update({ status: "completed", pdf_url: pdfUrl, borrower_signed: true, lender_signed: true })
      .eq("id", agreement.id);

    const loan = (agreement as any).loan;
    if (loan) {
      const { data: borrower } = await supabase.from("profiles").select("email").eq("id", loan.customer_id).maybeSingle();
      const { data: lender } = await supabase.from("profiles").select("email").eq("id", loan.admin_id).maybeSingle();

      for (const recipient of [
        { id: loan.customer_id, email: borrower?.email },
        { id: loan.admin_id, email: lender?.email },
      ]) {
        if (!recipient.email) continue;
        await dispatchNotification({
          orgId: loan.org_id,
          userId: recipient.id,
          userEmail: recipient.email,
          type: "agreement_signed",
          params: { agreementNumber: agreement.agreement_number },
        });
      }
    }

    await logAuditEntry({
      action: "Complete Lending Agreement",
      actor_id: "system",
      entity_type: "agreement",
      entity_id: agreement.id,
      details: `Lending agreement ${agreement.agreement_number} is fully signed and completed. PDF URL: ${pdfUrl || "Not specified"}.`,
    });
  }

  return NextResponse.json({ ok: true });
}
