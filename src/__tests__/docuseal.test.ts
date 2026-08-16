import { describe, it, expect } from "vitest";
import {
  generateAgreementNumber,
  generateDigitalSignatureHash,
  createLendingAgreement,
} from "../lib/agreements";
import type { AgreementParties } from "../lib/agreements";
import type { Loan, Profile } from "../types/database";

describe("Sahayam Native Digital E-Signature Engine", () => {
  it("generates correctly formatted agreement numbers with sequence padding", () => {
    const currentYear = new Date().getFullYear();
    expect(generateAgreementNumber(1)).toBe(`SHY-${currentYear}-000001`);
    expect(generateAgreementNumber(42)).toBe(`SHY-${currentYear}-000042`);
    expect(generateAgreementNumber(9999)).toBe(`SHY-${currentYear}-009999`);
  });

  it("generates cryptographic SHA-256 digital seal hash for immutable verification", () => {
    const seal = generateDigitalSignatureHash({
      agreementNumber: "SHY-2026-000001",
      borrowerId: "borrower-101",
      lenderId: "lender-202",
      amount: 25000,
    });

    expect(seal).toContain("SHY-SEAL-");
    expect(seal.length).toBeGreaterThan(15);
  });

  it("creates a native lending agreement with cryptographic digital seal without third-party services", async () => {
    const mockParties: AgreementParties = {
      loan: {
        id: "loan-12345678-abc",
        org_id: "org-1",
        customer_id: "cust-1",
        admin_id: "admin-1",
        amount: 25000,
        purpose: "Medical Advance",
        duration_days: 14,
        interest_rate_annual: 20.8,
        calculated_interest: 200,
        total_repayment: 25200,
        status: "approved",
        created_at: "2026-08-01T00:00:00Z",
      } as Loan,
      organization: {
        id: "org-1",
        name: "Sahayam Fintech",
        code: "SAHAYAM",
        created_at: "2026-01-01T00:00:00Z",
      },
      borrower: {
        id: "cust-1",
        org_id: "org-1",
        email: "borrower@test.com",
        full_name: "Rahul Verma",
        role: "borrower",
        verification_status: "verified",
        created_at: "2026-01-01T00:00:00Z",
      } as Profile,
      lender: {
        id: "admin-1",
        org_id: "org-1",
        email: "lender@test.com",
        full_name: "Admin Officer",
        role: "lender",
        verification_status: "verified",
        created_at: "2026-01-01T00:00:00Z",
      } as Profile,
      agreementNumber: "SHY-2026-000001",
    };

    const result = await createLendingAgreement(mockParties);

    expect(result.agreementNumber).toBe("SHY-2026-000001");
    expect(result.status).toBe("sent");
    expect(result.digitalSignatureHash).toContain("SHY-SEAL-");
    expect(result.pdfUrl).toBeNull();
  });
});
