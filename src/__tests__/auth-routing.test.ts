import { describe, it, expect } from "vitest";
import type { UserRole } from "../types/database";

export function resolveDashboardPath(role?: UserRole | null): string {
  if (role === "superadmin" || role === "admin") {
    return "/admin/dashboard";
  }
  return "/customer/dashboard";
}

describe("Unified Auth Role-Based Dashboard Routing", () => {
  it("routes superadmin role to /admin/dashboard", () => {
    expect(resolveDashboardPath("superadmin")).toBe("/admin/dashboard");
  });

  it("routes admin role to /admin/dashboard", () => {
    expect(resolveDashboardPath("admin")).toBe("/admin/dashboard");
  });

  it("routes customer role to /customer/dashboard", () => {
    expect(resolveDashboardPath("customer")).toBe("/customer/dashboard");
  });

  it("defaults guest or missing role to /customer/dashboard", () => {
    expect(resolveDashboardPath(null)).toBe("/customer/dashboard");
    expect(resolveDashboardPath(undefined)).toBe("/customer/dashboard");
  });
});
