import { describe, it, expect } from "vitest";
import { calculatePlanLoan, LOAN_PLANS } from "../lib/loan-math";

describe("Loan Math & Plan Calculations", () => {
  it("has 3 configured loan plans", () => {
    expect(LOAN_PLANS).toHaveLength(3);
    expect(LOAN_PLANS.map((p) => p.id)).toEqual(["7_days", "14_days", "21_days"]);
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

  it("calculates 21 days plan at 1.4% interest correctly", () => {
    const fixedDate = new Date("2026-08-01T00:00:00Z");
    const result = calculatePlanLoan(10000, "21_days", fixedDate);

    expect(result.principal).toBe(10000);
    expect(result.interest).toBe(140); // 10000 * 1.4% = 140
    expect(result.totalRepayment).toBe(10140);
    expect(result.dueDate).toBe("2026-08-22");
  });
});
