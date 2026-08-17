import { describe, it, expect } from "vitest";

// Compliance validators matching form requirements
function validateUpiId(upi: string): boolean {
  if (!upi || typeof upi !== "string") return false;
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  return upiRegex.test(upi.trim());
}

function validateIndianMobile(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  // Standard Indian 10-digit mobile check (or with +91)
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
}

function validateEmployeePaySlip(urlOrFilename: string): boolean {
  if (!urlOrFilename || typeof urlOrFilename !== "string") return false;
  const clean = urlOrFilename.trim().toLowerCase();
  return (
    clean.length > 3 &&
    (clean.endsWith(".pdf") ||
      clean.endsWith(".jpg") ||
      clean.endsWith(".jpeg") ||
      clean.endsWith(".png") ||
      clean.startsWith("http://") ||
      clean.startsWith("https://"))
  );
}

// Repayment math calculation with late fees
function calculateRepaymentBreakdown(params: {
  amount: number;
  durationDays: number;
  annualInterestRate: number;
  daysOverdue?: number;
  dailyLateFeePercent?: number;
}) {
  const { amount, durationDays, annualInterestRate, daysOverdue = 0, dailyLateFeePercent = 0.1 } = params;

  const baseInterest = Math.round(amount * (annualInterestRate / 100) * (durationDays / 365));
  const standardTotal = amount + baseInterest;

  let lateFee = 0;
  if (daysOverdue > 0) {
    lateFee = Math.round(amount * (dailyLateFeePercent / 100) * daysOverdue);
  }

  return {
    principal: amount,
    baseInterest,
    standardTotal,
    lateFee,
    finalTotal: standardTotal + lateFee,
    isOverdue: daysOverdue > 0,
  };
}

describe("Borrower Compliance Verification & Advanced Repayment Math", () => {
  describe("UPI ID Validation", () => {
    it("accepts valid UPI handle formats", () => {
      expect(validateUpiId("user@upi")).toBe(true);
      expect(validateUpiId("rahul.sharma@okaxis")).toBe(true);
      expect(validateUpiId("9876543210@ybl")).toBe(true);
      expect(validateUpiId("company@paytm")).toBe(true);
    });

    it("rejects invalid UPI handle formats", () => {
      expect(validateUpiId("plainuser")).toBe(false);
      expect(validateUpiId("user@")).toBe(false);
      expect(validateUpiId("@okaxis")).toBe(false);
      expect(validateUpiId("")).toBe(false);
    });
  });

  describe("Indian Mobile Number Validation", () => {
    it("accepts valid 10-digit Indian mobile numbers", () => {
      expect(validateIndianMobile("9876543210")).toBe(true);
      expect(validateIndianMobile("+919876543210")).toBe(true);
      expect(validateIndianMobile("919876543210")).toBe(true);
      expect(validateIndianMobile(" 88264 12345 ")).toBe(true);
    });

    it("rejects invalid mobile numbers", () => {
      expect(validateIndianMobile("12345")).toBe(false);
      expect(validateIndianMobile("123456789012345")).toBe(false);
      expect(validateIndianMobile("")).toBe(false);
    });
  });

  describe("Employee Pay Slip Document Proof Validation", () => {
    it("accepts valid pay slip file uploads and URLs", () => {
      expect(validateEmployeePaySlip("payslip_august_2026.pdf")).toBe(true);
      expect(validateEmployeePaySlip("salary_statement.jpg")).toBe(true);
      expect(validateEmployeePaySlip("https://storage.sahayam.app/payslips/doc123.png")).toBe(true);
    });

    it("rejects empty or invalid pay slip attachments", () => {
      expect(validateEmployeePaySlip("")).toBe(false);
      expect(validateEmployeePaySlip("   ")).toBe(false);
      expect(validateEmployeePaySlip("file_without_ext")).toBe(false);
    });
  });

  describe("Repayment Breakdown & Overdue Math", () => {
    it("calculates standard repayment without late fees on time", () => {
      const breakdown = calculateRepaymentBreakdown({
        amount: 20000,
        durationDays: 14,
        annualInterestRate: 20.8,
        daysOverdue: 0,
      });

      expect(breakdown.principal).toBe(20000);
      expect(breakdown.baseInterest).toBe(160); // 20000 * 0.208 * (14/365) ~ 160
      expect(breakdown.standardTotal).toBe(20160);
      expect(breakdown.lateFee).toBe(0);
      expect(breakdown.finalTotal).toBe(20160);
      expect(breakdown.isOverdue).toBe(false);
    });

    it("adds daily late fees when payment is overdue", () => {
      const breakdown = calculateRepaymentBreakdown({
        amount: 20000,
        durationDays: 14,
        annualInterestRate: 20.8,
        daysOverdue: 5, // 5 days overdue
        dailyLateFeePercent: 0.1, // 0.1% per day
      });

      expect(breakdown.principal).toBe(20000);
      expect(breakdown.isOverdue).toBe(true);
      expect(breakdown.lateFee).toBe(100); // 20000 * (0.1/100) * 5 = 100
      expect(breakdown.finalTotal).toBe(20260); // 20160 + 100
    });
  });
});
