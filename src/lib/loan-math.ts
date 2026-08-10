/**
 * Single source of truth for loan interest math — used by both the
 * live calculator (client) and the loan-request Server Action, so the
 * number the customer sees is guaranteed to match what gets persisted.
 *
 * Simple interest: I = P * R * T / (365 * 100)
 *   P = principal (amount)
 *   R = annual interest rate (%)
 *   T = duration in days
 */
export interface LoanCalculation {
  principal: number;
  interest: number;
  totalRepayment: number;
  dueDate: string; // ISO date
}

export interface LoanPlan {
  id: "7_days" | "14_days" | "21_days" | "30_days";
  name: string;
  days: number;
  ratePercent: number; // Flat interest % for period
  description: string;
}

export const LOAN_PLANS: LoanPlan[] = [
  {
    id: "7_days",
    name: "7 Days",
    days: 7,
    ratePercent: 0.4,
    description: "7 days at 0.4% interest",
  },
  {
    id: "14_days",
    name: "14 Days",
    days: 14,
    ratePercent: 0.8,
    description: "14 days at 0.8% interest",
  },
  {
    id: "21_days",
    name: "21 Days",
    days: 21,
    ratePercent: 1.2,
    description: "21 days at 1.2% interest",
  },
  {
    id: "30_days",
    name: "30 Days",
    days: 30,
    ratePercent: 1.5,
    description: "30 days at 1.5% interest",
  },
];

export type LoanPlanId = (typeof LOAN_PLANS)[number]["id"];

export function getLoanPlan(planId: string): LoanPlan {
  return LOAN_PLANS.find((p) => p.id === planId) || LOAN_PLANS[0];
}

export function calculatePlanLoan(
  amount: number,
  planId: string,
  fromDate: Date = new Date()
): LoanCalculation & { plan: LoanPlan; annualEquivalentRate: number } {
  const plan = getLoanPlan(planId);
  const principal = Math.max(0, amount || 0);
  const interest = (principal * plan.ratePercent) / 100;
  const totalRepayment = principal + interest;

  const due = new Date(fromDate);
  due.setDate(due.getDate() + plan.days);

  // Annualized rate equivalent for database column `interest_rate_annual`: (flatRate / days) * 365
  const annualEquivalentRate = (plan.ratePercent / plan.days) * 365;

  return {
    principal,
    interest: Math.round(interest * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    dueDate: due.toISOString().slice(0, 10),
    plan,
    annualEquivalentRate: Math.round(annualEquivalentRate * 100) / 100,
  };
}

export function calculateLoan(
  amount: number,
  interestRateAnnual: number,
  durationDays: number,
  fromDate: Date = new Date()
): LoanCalculation {
  const principal = Math.max(0, amount || 0);
  const rate = Math.max(0, interestRateAnnual || 0);
  const days = Math.max(0, Math.round(durationDays || 0));

  const interest = (principal * rate * days) / (365 * 100);
  const totalRepayment = principal + interest;

  const due = new Date(fromDate);
  due.setDate(due.getDate() + days);

  return {
    principal,
    interest: Math.round(interest * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    dueDate: due.toISOString().slice(0, 10),
  };
}
