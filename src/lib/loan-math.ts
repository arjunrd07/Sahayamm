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
