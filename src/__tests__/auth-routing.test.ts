import { describe, it, expect } from "vitest";
import type { UserRole } from "../types/database";

export function resolveDashboardPath(role?: UserRole | null): string {
  if (role === "admin" || role === "lender") {
    return "/lender/dashboard";
  }
  return "/borrower/dashboard";
}

describe("Unified Auth Role-Based Dashboard Routing", () => {
  it("routes admin role to /lender/dashboard", () => {
    expect(resolveDashboardPath("admin")).toBe("/lender/dashboard");
  });

  it("routes lender role to /lender/dashboard", () => {
    expect(resolveDashboardPath("lender")).toBe("/lender/dashboard");
  });

  it("routes borrower role to /borrower/dashboard", () => {
    expect(resolveDashboardPath("borrower")).toBe("/borrower/dashboard");
  });

  it("defaults guest or missing role to /borrower/dashboard", () => {
    expect(resolveDashboardPath(null)).toBe("/borrower/dashboard");
    expect(resolveDashboardPath(undefined)).toBe("/borrower/dashboard");
  });
});
