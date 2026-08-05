import { describe, it, expect } from "vitest";

function validateSuperadminCredentials(email: string, pass: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  return cleanEmail === "superadmin@gmail.com" && pass === "Superadmin@Sahayamm";
}

function computeSoftDeleteOrgStatus(currentStatus: string): string {
  return currentStatus === "active" ? "inactive" : "active";
}

function toggleUserVerificationStatus(currentStatus: string): string {
  return currentStatus === "rejected" ? "verified" : "rejected";
}

function formatAuditCSVRow(log: { id: string; action: string; details: string }): string {
  return `${log.id},"${log.action.replace(/"/g, '""')}","${log.details.replace(/"/g, '""')}"`;
}

describe("Superadmin Platform Control & Logic Tests", () => {
  it("authenticates default Superadmin credentials with case-insensitive email", () => {
    expect(validateSuperadminCredentials("Superadmin@gmail.com", "Superadmin@Sahayamm")).toBe(true);
    expect(validateSuperadminCredentials("superadmin@gmail.com", "Superadmin@Sahayamm")).toBe(true);
    expect(validateSuperadminCredentials("SUPERADMIN@GMAIL.COM ", "Superadmin@Sahayamm")).toBe(true);
    expect(validateSuperadminCredentials("wrong@gmail.com", "Superadmin@Sahayamm")).toBe(false);
  });

  it("handles organization soft-delete status transitions correctly", () => {
    expect(computeSoftDeleteOrgStatus("active")).toBe("inactive");
    expect(computeSoftDeleteOrgStatus("inactive")).toBe("active");
  });

  it("toggles user verification access status for revocation/restoration", () => {
    expect(toggleUserVerificationStatus("verified")).toBe("rejected");
    expect(toggleUserVerificationStatus("pending")).toBe("rejected");
    expect(toggleUserVerificationStatus("rejected")).toBe("verified");
  });

  it("formats audit log CSV rows securely escaping special quotes", () => {
    const sampleLog = {
      id: "log-1",
      action: 'Revoke User Access "John Doe"',
      details: "Access revoked due to policy update",
    };
    const csvRow = formatAuditCSVRow(sampleLog);
    expect(csvRow).toContain('log-1,"Revoke User Access ""John Doe"""');
  });
});
