import { describe, it, expect } from "vitest";
import { calculatePlanLoan, LOAN_PLANS } from "../lib/loan-math";

describe("Loan Math & Plan Calculations", () => {
  it("has 4 configured loan plans", () => {
    expect(LOAN_PLANS).toHaveLength(4);
    expect(LOAN_PLANS.map((p) => p.id)).toEqual(["7_days", "14_days", "21_days", "30_days"]);
  });

  it("calculates 7 days plan at 0.4% interest correctly", () => {
    const fixedDate = new Date("2026-08-01T00:00:00Z");
    const result = calculatePlanLoan(10000, "7_days", fixedDate);

    expect(result.principal).toBe(10000);
    expect(result.interest).toBe(40); // 10000 * 0.4% = 40
    expect(result.totalRepayment).toBe(10040);
    expect(result.dueDate).toBe("2026-08-08");
  });

  it("calculates 14 days plan at 0.8% interest correctly", () => {
    const fixedDate = new Date("2026-08-01T00:00:00Z");
    const result = calculatePlanLoan(10000, "14_days", fixedDate);

    expect(result.principal).toBe(10000);
    expect(result.interest).toBe(80); // 10000 * 0.8% = 80
    expect(result.totalRepayment).toBe(10080);
    expect(result.dueDate).toBe("2026-08-15");
  });

  it("calculates 21 days plan at 1.2% interest correctly", () => {
    const fixedDate = new Date("2026-08-01T00:00:00Z");
    const result = calculatePlanLoan(10000, "21_days", fixedDate);

    expect(result.principal).toBe(10000);
    expect(result.interest).toBe(120); // 10000 * 1.2% = 120
    expect(result.totalRepayment).toBe(10120);
    expect(result.dueDate).toBe("2026-08-22");
  });

  it("calculates 30 days plan at 1.5% interest correctly", () => {
    const fixedDate = new Date("2026-08-01T00:00:00Z");
    const result = calculatePlanLoan(10000, "30_days", fixedDate);

    expect(result.principal).toBe(10000);
    expect(result.interest).toBe(150); // 10000 * 1.5% = 150
    expect(result.totalRepayment).toBe(10150);
    expect(result.dueDate).toBe("2026-08-31");
  });
});
