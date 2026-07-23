import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/notify";
import { formatINR, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Intended to be hit by a scheduled job (e.g. Vercel Cron, once daily).
 * Protect with a shared secret in production — see CRON_SECRET below.
 *
 *   # vercel.json
 *   { "crons": [{ "path": "/api/notifications/cron", "schedule": "0 3 * * *" }] }
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const today = new Date();
  const in3Days = new Date(today);
  in3Days.setDate(in3Days.getDate() + 3);

  const todayStr = today.toISOString().slice(0, 10);
  const in3DaysStr = in3Days.toISOString().slice(0, 10);

  // --- Repayment reminders: active loans due within the next 3 days ---
  const { data: dueSoon } = await supabase
    .from("loans")
    .select("*, customer:profiles!loans_customer_id_fkey(email)")
    .eq("status", "active")
    .gte("due_date", todayStr)
    .lte("due_date", in3DaysStr);

  for (const loan of dueSoon || []) {
    await dispatchNotification({
      orgId: loan.org_id,
      userId: loan.customer_id,
      userEmail: (loan as any).customer?.email,
      loanId: loan.id,
      type: "repayment_reminder",
      params: { amount: formatINR(loan.total_repayment), dueDate: formatDate(loan.due_date) },
    });
  }

  // --- Overdue: active loans past due date, not yet flagged ---
  const { data: overdue } = await supabase
    .from("loans")
    .select("*, customer:profiles!loans_customer_id_fkey(email)")
    .eq("status", "active")
    .lt("due_date", todayStr);

  for (const loan of overdue || []) {
    await supabase.from("loans").update({ status: "overdue" }).eq("id", loan.id);
    await dispatchNotification({
      orgId: loan.org_id,
      userId: loan.customer_id,
      userEmail: (loan as any).customer?.email,
      loanId: loan.id,
      type: "loan_overdue",
      params: { amount: formatINR(loan.total_repayment), dueDate: formatDate(loan.due_date) },
    });
  }

  return NextResponse.json({
    remindersSent: dueSoon?.length || 0,
    markedOverdue: overdue?.length || 0,
  });
}
