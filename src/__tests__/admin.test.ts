import { describe, it, expect } from "vitest";

function validateAdminCredentials(email: string, pass: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  return cleanEmail === "admin@gmail.com" && pass === "Admin@Sahayamm";
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

describe("Admin Platform Control & Logic Tests", () => {
  it("authenticates default Admin credentials with case-insensitive email", () => {
    expect(validateAdminCredentials("Admin@gmail.com", "Admin@Sahayamm")).toBe(true);
    expect(validateAdminCredentials("admin@gmail.com", "Admin@Sahayamm")).toBe(true);
    expect(validateAdminCredentials("ADMIN@GMAIL.COM ", "Admin@Sahayamm")).toBe(true);
    expect(validateAdminCredentials("wrong@gmail.com", "Admin@Sahayamm")).toBe(false);
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
