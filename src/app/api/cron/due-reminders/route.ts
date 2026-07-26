import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { dispatchNotification } from "@/lib/notify";
import { formatINR } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const supabase = createServiceRoleClient();
    const todayStr = new Date().toISOString().slice(0, 10);

    // Fetch active loans with due dates
    const { data: activeLoans, error } = await supabase
      .from("loans")
      .select("*, customer:profiles!loans_customer_id_fkey(full_name, email)")
      .in("status", ["active", "approved"]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let remindersSent = 0;

    for (const loan of activeLoans || []) {
      if (!loan.due_date) continue;

      const dueDate = new Date(loan.due_date);
      const today = new Date();
      const diffMs = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Trigger reminders if due in 1, 3, or exact plan milestones
      if (diffDays <= 3 && diffDays >= 0) {
        // Notify Borrower
        await dispatchNotification({
          orgId: loan.org_id,
          userId: loan.customer_id,
          userEmail: (loan as any).customer?.email || "",
          loanId: loan.id,
          type: "repayment_reminder",
          params: { amount: formatINR(loan.total_repayment), dueDate: loan.due_date },
        });

        // Notify Lenders in Org
        const { data: lenders } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("org_id", loan.org_id)
          .in("role", ["lender", "admin", "superadmin"]);

        for (const lender of lenders || []) {
          await dispatchNotification({
            orgId: loan.org_id,
            userId: lender.id,
            userEmail: lender.email,
            loanId: loan.id,
            type: "repayment_reminder",
            params: {
              customerName: (loan as any).customer?.full_name || "Borrower",
              amount: formatINR(loan.total_repayment),
              dueDate: loan.due_date,
            },
          });
        }

        remindersSent++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${activeLoans?.length || 0} loans. ${remindersSent} reminders dispatched.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Cron execution failed." }, { status: 500 });
  }
}
