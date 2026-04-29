import { INTEREST_RATE } from '../utils/constants';

export interface LoanCalculation {
  simpleInterest: number;
  totalRepayment: number;
}

/**
 * Calculates Simple Interest and total repayment.
 * Formula: SI = (P × R × T) / (365 × 100) where T = tenure in days
 * Interest rate is fixed at 12% p.a.
 */
export const calculateLoan = (principal: number, tenureDays: number): LoanCalculation => {
  const si = (principal * INTEREST_RATE * tenureDays) / (365 * 100);
  const roundedSI = Math.round(si * 100) / 100;
  const totalRepayment = Math.round((principal + roundedSI) * 100) / 100;

  return {
    simpleInterest: roundedSI,
    totalRepayment,
  };
};
