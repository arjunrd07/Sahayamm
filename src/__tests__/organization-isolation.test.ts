import { describe, it, expect } from "vitest";

interface ProfileRecord {
  id: string;
  org_id: string | null;
  campus_id?: string | null;
  full_name: string;
  role: "borrower" | "lender" | "admin";
}

interface LoanRecord {
  id: string;
  org_id: string;
  campus_id?: string;
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

// Multi-tenant organization and campus isolation helper
function filterLoansForLender(
  loans: LoanRecord[],
  lenderProfile: ProfileRecord
): LoanRecord[] {
  // Admin has global oversight across all organizations and campuses
  if (lenderProfile.role === "admin") {
    return loans;
  }
  // Lender sees only loans belonging to their organization
  if (lenderProfile.role === "lender" && lenderProfile.org_id) {
    return loans.filter((l) => {
      const matchOrg = l.org_id === lenderProfile.org_id;
      if (!matchOrg) return false;
      if (lenderProfile.campus_id && l.campus_id) {
        return l.campus_id === lenderProfile.campus_id;
      }
      return true;
    });
  }
  return [];
}

function canLenderVerifyBorrower(
  lender: ProfileRecord,
  borrower: ProfileRecord
): { allowed: boolean; reason?: string } {
  if (lender.role === "admin") return { allowed: true };
  if (lender.role !== "lender") return { allowed: false, reason: "Must be a lender or admin" };
  if (lender.org_id !== borrower.org_id) {
    return { allowed: false, reason: "Borrower belongs to a different organization" };
  }
  if (lender.campus_id && borrower.campus_id && lender.campus_id !== borrower.campus_id) {
    return { allowed: false, reason: "Borrower belongs to a different campus location" };
  }
  return { allowed: true };
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

describe("Multi-Tenant Organization & Campus Isolation Governance", () => {
  const org1: OrganizationRecord = {
    id: "org-100",
    name: "FinCorp One",
    code: "FIN1",
    status: "active",
    capital_pool_limit: 100000,
  };

  const mockLoans: LoanRecord[] = [
    { id: "loan-1", org_id: "org-100", campus_id: "campus-A", customer_id: "user-1", amount: 25000, status: "pending" },
    { id: "loan-2", org_id: "org-100", campus_id: "campus-B", customer_id: "user-2", amount: 15000, status: "approved" },
    { id: "loan-3", org_id: "org-200", campus_id: "campus-C", customer_id: "user-3", amount: 40000, status: "pending" },
  ];

  it("filters loans strictly by organization and campus for lenders", () => {
    const lenderOrg1CampusA: ProfileRecord = {
      id: "lender-1",
      org_id: "org-100",
      campus_id: "campus-A",
      full_name: "Lender One (Campus A)",
      role: "lender",
    };

    const lenderOrg1AllCampuses: ProfileRecord = {
      id: "lender-2",
      org_id: "org-100",
      campus_id: null,
      full_name: "Lender Org Head",
      role: "lender",
    };

    const visibleForCampusA = filterLoansForLender(mockLoans, lenderOrg1CampusA);
    const visibleForOrgHead = filterLoansForLender(mockLoans, lenderOrg1AllCampuses);

    expect(visibleForCampusA).toHaveLength(1);
    expect(visibleForCampusA[0].id).toBe("loan-1");

    expect(visibleForOrgHead).toHaveLength(2);
    expect(visibleForOrgHead.map((l) => l.id)).toEqual(["loan-1", "loan-2"]);
  });

  it("allows admin global oversight across all organizations and campuses", () => {
    const admin: ProfileRecord = {
      id: "admin-1",
      org_id: null,
      full_name: "Administrator",
      role: "admin",
    };

    const visibleForAdmin = filterLoansForLender(mockLoans, admin);
    expect(visibleForAdmin).toHaveLength(3);
  });

  it("prevents lenders from verifying borrowers outside their assigned organization and campus", () => {
    const lender: ProfileRecord = {
      id: "lender-1",
      org_id: "org-100",
      campus_id: "campus-A",
      full_name: "Lender Org1 CampusA",
      role: "lender",
    };

    const borrowerSameCampus: ProfileRecord = {
      id: "b-1",
      org_id: "org-100",
      campus_id: "campus-A",
      full_name: "Borrower 1",
      role: "borrower",
    };

    const borrowerDiffCampus: ProfileRecord = {
      id: "b-2",
      org_id: "org-100",
      campus_id: "campus-B",
      full_name: "Borrower 2",
      role: "borrower",
    };

    const borrowerDiffOrg: ProfileRecord = {
      id: "b-3",
      org_id: "org-200",
      campus_id: "campus-A",
      full_name: "Borrower 3",
      role: "borrower",
    };

    expect(canLenderVerifyBorrower(lender, borrowerSameCampus).allowed).toBe(true);
    expect(canLenderVerifyBorrower(lender, borrowerDiffCampus).allowed).toBe(false);
    expect(canLenderVerifyBorrower(lender, borrowerDiffOrg).allowed).toBe(false);
  });

  it("enforces capital pool limit checks on loan applications", () => {
    expect(canBorrowerRequestLoan(50000, org1).allowed).toBe(true);
    expect(canBorrowerRequestLoan(150000, org1).allowed).toBe(false);
    expect(canBorrowerRequestLoan(150000, org1).reason).toContain("exceeds organization capital limit");
  });
});
