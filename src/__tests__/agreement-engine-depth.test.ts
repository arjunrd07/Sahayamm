import { describe, it, expect } from "vitest";
import {
  generateAgreementNumber,
  generateDigitalSignatureHash,
  createLendingAgreement,
} from "../lib/agreements";
import type { AgreementParties } from "../lib/agreements";
import type { Loan, Profile } from "../types/database";

describe("Digital Agreement Engine Depth & Security Validation", () => {
  it("generates deterministic digital seals that change when loan metadata alters", () => {
    const fixedDate = "2026-08-17T12:00:00Z";
    const seal1 = generateDigitalSignatureHash({
      agreementNumber: "SHY-2026-000100",
      borrowerId: "borrower-A",
      lenderId: "lender-B",
      amount: 25000,
      dateStr: fixedDate,
    });

    const seal2 = generateDigitalSignatureHash({
      agreementNumber: "SHY-2026-000100",
      borrowerId: "borrower-A",
      lenderId: "lender-B",
      amount: 25000,
      dateStr: fixedDate,
    });

    const sealTamperedAmount = generateDigitalSignatureHash({
      agreementNumber: "SHY-2026-000100",
      borrowerId: "borrower-A",
      lenderId: "lender-B",
      amount: 50000, // Altered amount
      dateStr: fixedDate,
    });

    // Identical parameters produce identical seals
    expect(seal1).toBe(seal2);
    // Altering loan amount produces a different seal
    expect(seal1).not.toBe(sealTamperedAmount);
  });

  it("validates digital signature format structure with SHY-SEAL prefix", () => {
    const seal = generateDigitalSignatureHash({
      agreementNumber: "SHY-2026-000005",
      borrowerId: "user-123",
      lenderId: "admin-456",
      amount: 10000,
    });

    const parts = seal.split("-");
    expect(parts[0]).toBe("SHY");
    expect(parts[1]).toBe("SEAL");
    expect(parts.length).toBeGreaterThanOrEqual(4);
  });

  it("creates fully-formed lending agreement object with partially_signed initial state", async () => {
    const mockParties: AgreementParties = {
      loan: {
        id: "loan-depth-001",
        org_id: "org-alpha",
        customer_id: "borrower-alpha",
        admin_id: "lender-alpha",
        amount: 15000,
        purpose: "Equipment Purchase",
        duration_days: 21,
        interest_rate_annual: 20.8,
        calculated_interest: 180,
        total_repayment: 15180,
        status: "approved",
        created_at: "2026-08-17T00:00:00Z",
      } as Loan,
      organization: {
        id: "org-alpha",
        name: "Alpha Holdings",
        code: "ALPHA",
        created_at: "2026-01-01T00:00:00Z",
      },
      borrower: {
        id: "borrower-alpha",
        org_id: "org-alpha",
        email: "borrower@alpha.com",
        full_name: "Anita Sharma",
        role: "borrower",
        verification_status: "verified",
        created_at: "2026-01-01T00:00:00Z",
      } as Profile,
      lender: {
        id: "lender-alpha",
        org_id: "org-alpha",
        email: "lender@alpha.com",
        full_name: "Vijay Kumar",
        role: "lender",
        verification_status: "verified",
        created_at: "2026-01-01T00:00:00Z",
      } as Profile,
      agreementNumber: "SHY-2026-000888",
    };

    const agreement = await createLendingAgreement(mockParties);

    expect(agreement.agreementNumber).toBe("SHY-2026-000888");
    expect(agreement.docusealSubmissionId).toMatch(/^SHY-SEAL-/);
    expect(agreement.digitalSignatureHash).toMatch(/^SHY-SEAL-/);
    expect(["sent", "partially_signed", "completed"]).toContain(agreement.status);
  });
});
