import type { Loan, Organization, Profile } from "@/types/database";

export interface AgreementParties {
  loan: Loan;
  organization: Organization;
  borrower: Profile;
  lender: Profile;
  agreementNumber: string;
}

export interface CreateAgreementResult {
  docusealSubmissionId: string | null;
  pdfUrl: string | null;
  status: "draft" | "sent";
  mock: boolean;
}

const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;
const DOCUSEAL_BASE_URL = process.env.DOCUSEAL_BASE_URL || "https://api.docuseal.com";
const DOCUSEAL_TEMPLATE_ID = process.env.DOCUSEAL_TEMPLATE_ID;

/**
 * Creates the "Internal Lending Agreement" submission in DocuSeal and
 * requests signatures from both borrower and lender.
 *
 * When DOCUSEAL_API_KEY is not configured, falls back to a mock engine
 * so the rest of the product (agreement viewer, notifications, status
 * tracking) is fully testable without a live DocuSeal account.
 */
export async function createLendingAgreement(
  parties: AgreementParties
): Promise<CreateAgreementResult> {
  if (!DOCUSEAL_API_KEY || !DOCUSEAL_TEMPLATE_ID) {
    return createMockAgreement(parties);
  }

  const { loan, organization, borrower, lender, agreementNumber } = parties;

  const res = await fetch(`${DOCUSEAL_BASE_URL}/submissions`, {
    method: "POST",
    headers: {
      "X-Auth-Token": DOCUSEAL_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template_id: DOCUSEAL_TEMPLATE_ID,
      send_email: true,
      submitters: [
        {
          role: "Borrower",
          name: borrower.full_name,
          email: borrower.email,
        },
        {
          role: "Lender",
          name: lender.full_name,
          email: lender.email,
        },
      ],
      fields: [
        { name: "agreement_number", default_value: agreementNumber },
        { name: "organization_name", default_value: organization.name },
        { name: "loan_amount", default_value: String(loan.amount) },
        { name: "interest_amount", default_value: String(loan.calculated_interest) },
        { name: "total_repayment", default_value: String(loan.total_repayment) },
        { name: "duration_days", default_value: String(loan.duration_days) },
        { name: "due_date", default_value: loan.due_date ?? "" },
        { name: "governing_law", default_value: "Laws of India" },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`DocuSeal submission failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const submissionId = String(data?.id ?? data?.[0]?.submission_id ?? "");

  return {
    docusealSubmissionId: submissionId || null,
    pdfUrl: null, // populated later via webhook once fully signed
    status: "sent",
    mock: false,
  };
}

function createMockAgreement(parties: AgreementParties): CreateAgreementResult {
  // Deterministic fake id so repeated calls in dev are traceable.
  const mockId = `mock_${parties.loan.id.slice(0, 8)}`;
  return {
    docusealSubmissionId: mockId,
    pdfUrl: null,
    status: "sent",
    mock: true,
  };
}

/** Human-readable agreement number, e.g. SHY-2026-000042 */
export function generateAgreementNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `SHY-${year}-${String(sequence).padStart(6, "0")}`;
}
