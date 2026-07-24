import { describe, it, expect } from "vitest";
import { formatINR, formatDate, initials, cn } from "../lib/utils";

describe("Utility Functions", () => {
  it("formats currency to INR properly", () => {
    const formatted = formatINR(50000);
    expect(formatted).toContain("50,000");
  });

  it("extracts initials correctly", () => {
    expect(initials("John Doe")).toBe("JD");
    expect(initials("Super Admin User")).toBe("SA");
    expect(initials("Sahayam")).toBe("S");
  });

  it("formats date strings into clean readable date", () => {
    const formatted = formatDate("2026-07-24T12:00:00Z");
    expect(formatted).toContain("2026");
  });

  it("merges class names correctly with cn()", () => {
    const result = cn("px-4 py-2", "bg-white", { "text-black": true });
    expect(result).toBe("px-4 py-2 bg-white text-black");
  });
});
