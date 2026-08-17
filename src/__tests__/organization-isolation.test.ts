import { describe, it, expect } from "vitest";

interface ProfileRecord {
  id: string;
  org_id: string | null;
  full_name: string;
  role: "borrower" | "lender" | "superadmin";
}

interface LoanRecord {
  id: string;
  org_id: string;
  customer_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "active" | "completed";
}

interface OrganizationRecord {
  id: string;
  name: string;
  code: string;
  status: "active" | "inactive";
  capital_pool_limit: number;
}

// Isolation helper mirroring server action multi-tenant logic
function filterLoansForLender(
  loans: LoanRecord[],
  lenderProfile: ProfileRecord
): LoanRecord[] {
  // Superadmin sees all
  if (lenderProfile.role === "superadmin") {
    return loans;
  }
  // Lender sees only loans belonging to their organization
  if (lenderProfile.role === "lender" && lenderProfile.org_id) {
    return loans.filter((l) => l.org_id === lenderProfile.org_id);
  }
  return [];
}

function canBorrowerRequestLoan(
  amount: number,
  org: OrganizationRecord
): { allowed: boolean; reason?: string } {
  if (org.status !== "active") {
    return { allowed: false, reason: "Organization is currently inactive" };
  }
  if (amount > org.capital_pool_limit) {
    return {
      allowed: false,
      reason: `Loan amount exceeds organization capital limit of ₹${org.capital_pool_limit}`,
    };
  }
  return { allowed: true };
}

describe("Multi-Tenant Organization Isolation & Liquidity Governance", () => {
  const org1: OrganizationRecord = {
    id: "org-100",
    name: "FinCorp One",
    code: "FIN1",
    status: "active",
    capital_pool_limit: 100000,
  };

  const org2: OrganizationRecord = {
    id: "org-200",
    name: "FinCorp Two",
    code: "FIN2",
    status: "active",
    capital_pool_limit: 50000,
  };

  const inactiveOrg: OrganizationRecord = {
    id: "org-300",
    name: "Suspended Org",
    code: "SUSP",
    status: "inactive",
    capital_pool_limit: 100000,
  };

  const mockLoans: LoanRecord[] = [
    { id: "loan-1", org_id: "org-100", customer_id: "user-1", amount: 25000, status: "pending" },
    { id: "loan-2", org_id: "org-100", customer_id: "user-2", amount: 15000, status: "approved" },
    { id: "loan-3", org_id: "org-200", customer_id: "user-3", amount: 40000, status: "pending" },
  ];

  it("filters loan applications strictly by organization for lenders", () => {
    const lenderOrg1: ProfileRecord = {
      id: "lender-1",
      org_id: "org-100",
      full_name: "Lender One",
      role: "lender",
    };

    const lenderOrg2: ProfileRecord = {
      id: "lender-2",
      org_id: "org-200",
      full_name: "Lender Two",
      role: "lender",
    };

    const visibleForOrg1 = filterLoansForLender(mockLoans, lenderOrg1);
    const visibleForOrg2 = filterLoansForLender(mockLoans, lenderOrg2);

    expect(visibleForOrg1).toHaveLength(2);
    expect(visibleForOrg1.map((l) => l.id)).toEqual(["loan-1", "loan-2"]);

    expect(visibleForOrg2).toHaveLength(1);
    expect(visibleForOrg2.map((l) => l.id)).toEqual(["loan-3"]);
  });

  it("allows superadmin to oversee loans across all organizations", () => {
    const superadmin: ProfileRecord = {
      id: "superadmin-1",
      org_id: null,
      full_name: "Super Administrator",
      role: "superadmin",
    };

    const visibleForSuperadmin = filterLoansForLender(mockLoans, superadmin);
    expect(visibleForSuperadmin).toHaveLength(3);
  });

  it("enforces capital pool limit checks on loan applications", () => {
    expect(canBorrowerRequestLoan(50000, org1).allowed).toBe(true);
    expect(canBorrowerRequestLoan(150000, org1).allowed).toBe(false);
    expect(canBorrowerRequestLoan(150000, org1).reason).toContain("exceeds organization capital limit");
  });

  it("blocks loan requests for inactive soft-deleted organizations", () => {
    const check = canBorrowerRequestLoan(10000, inactiveOrg);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe("Organization is currently inactive");
  });
});
