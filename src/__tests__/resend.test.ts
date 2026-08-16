import { describe, it, expect } from "vitest";
import { notificationCopy, sendEmail } from "../lib/resend";

describe("Resend Transactional Email Engine & Templates", () => {
  it("formats verification_decision copy correctly for approval and rejection", () => {
    const approvalCopy = notificationCopy.verification_decision({
      approved: "true",
      orgName: "Sahayam Org",
    });
    expect(approvalCopy.title).toBe("Verification approved");
    expect(approvalCopy.message).toContain("Sahayam Org");

    const rejectionCopy = notificationCopy.verification_decision({
      approved: "false",
      reason: "Incomplete Document",
    });
    expect(rejectionCopy.title).toBe("Verification rejected");
    expect(rejectionCopy.message).toContain("Incomplete Document");
  });

  it("formats loan_requested copy for borrower vs lender", () => {
    const borrowerCopy = notificationCopy.loan_requested({
      isBorrower: "true",
      amount: "₹10,000",
    });
    expect(borrowerCopy.title).toBe("Request Submitted");
    expect(borrowerCopy.message).toContain("₹10,000");

    const lenderCopy = notificationCopy.loan_requested({
      isBorrower: "false",
      customerName: "Ananya",
      amount: "₹10,000",
      purpose: "Medical",
    });
    expect(lenderCopy.title).toBe("New loan request");
    expect(lenderCopy.message).toContain("Ananya requested ₹10,000");
  });

  it("formats repayment_reminder and loan_overdue copy", () => {
    const reminderCopy = notificationCopy.repayment_reminder({
      amount: "₹5,000",
      dueDate: "2026-08-25",
    });
    expect(reminderCopy.title).toBe("Repayment due soon");
    expect(reminderCopy.message).toContain("2026-08-25");

    const overdueCopy = notificationCopy.loan_overdue({
      amount: "₹5,000",
      dueDate: "2026-08-10",
    });
    expect(overdueCopy.title).toBe("Loan overdue");
    expect(overdueCopy.message).toContain("is now overdue");
  });

  it("returns mock result when RESEND_API_KEY is not configured", async () => {
    const result = await sendEmail({
      to: "user@example.com",
      type: "loan_approved",
      subject: "Test Subject",
      body: "Test Body",
    });

    expect(result.sent).toBe(true);
    expect(result.mock).toBe(true);
  });
});
