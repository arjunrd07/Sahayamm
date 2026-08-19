import { describe, it, expect } from "vitest";
import type { UserRole } from "../types/database";

export function isRouteAllowed(role: UserRole | null | undefined, pathname: string): boolean {
  const userRole = role || "borrower";

  if (pathname.startsWith("/lender")) {
    return userRole === "lender" || userRole === "admin";
  }

  if (pathname.startsWith("/borrower")) {
    return true;
  }

  return true;
}

export function canAccessOrgData(
  userRole: UserRole,
  userOrgId: string,
  targetOrgId: string
): boolean {
  if (userRole === "admin") {
    return true; // Admin has global access across all orgs
  }
  return userOrgId === targetOrgId; // Lenders and Borrowers strictly scoped to their org
}

describe("Role-Based Access Control (RBAC) & Multi-Tenancy Rules", () => {
  describe("Route Access Control", () => {
    it("restricts /lender routes to lender and admin roles", () => {
      expect(isRouteAllowed("admin", "/lender/dashboard")).toBe(true);
      expect(isRouteAllowed("lender", "/lender/dashboard")).toBe(true);
      expect(isRouteAllowed("borrower", "/lender/dashboard")).toBe(false);
    });

    it("allows access to /borrower routes for all authenticated roles", () => {
      expect(isRouteAllowed("borrower", "/borrower/dashboard")).toBe(true);
      expect(isRouteAllowed("lender", "/borrower/dashboard")).toBe(true);
      expect(isRouteAllowed("admin", "/borrower/dashboard")).toBe(true);
    });
  });

  describe("Multi-Tenancy Data Scoping", () => {
    const ORG_A = "org-1111-aaaa";
    const ORG_B = "org-2222-bbbb";

    it("grants admin access to any organization data", () => {
      expect(canAccessOrgData("admin", ORG_A, ORG_B)).toBe(true);
      expect(canAccessOrgData("admin", ORG_A, ORG_A)).toBe(true);
    });

    it("restricts lenders to data within their own organization", () => {
      expect(canAccessOrgData("lender", ORG_A, ORG_A)).toBe(true);
      expect(canAccessOrgData("lender", ORG_A, ORG_B)).toBe(false);
    });

    it("restricts borrowers to data within their own organization", () => {
      expect(canAccessOrgData("borrower", ORG_A, ORG_A)).toBe(true);
      expect(canAccessOrgData("borrower", ORG_A, ORG_B)).toBe(false);
    });
  });
});
