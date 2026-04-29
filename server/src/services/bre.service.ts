import {
  BRE_MIN_AGE,
  BRE_MAX_AGE,
  BRE_MIN_SALARY,
  PAN_REGEX,
  EmploymentMode,
} from '../utils/constants';

export interface BREInput {
  dateOfBirth: string | Date;
  monthlySalary: number;
  pan: string;
  employmentMode: EmploymentMode;
}

export interface BREResult {
  passed: boolean;
  errors: string[];
}

/**
 * Business Rule Engine — evaluates borrower eligibility.
 * All rules must pass for the application to proceed.
 * Runs server-side only to prevent client-side bypass.
 */
export const evaluateBRE = (input: BREInput): BREResult => {
  const errors: string[] = [];

  // ── Rule 1: Age must be between 23 and 50 ──────────────────────────────
  const dob = new Date(input.dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < BRE_MIN_AGE || age > BRE_MAX_AGE) {
    errors.push(`Age must be between ${BRE_MIN_AGE} and ${BRE_MAX_AGE} years. Your age: ${age}.`);
  }

  // ── Rule 2: Monthly salary must be at least ₹25,000 ────────────────────
  if (input.monthlySalary < BRE_MIN_SALARY) {
    errors.push(
      `Monthly salary must be at least ₹${BRE_MIN_SALARY.toLocaleString()}. Your salary: ₹${input.monthlySalary.toLocaleString()}.`
    );
  }

  // ── Rule 3: PAN must match valid format ─────────────────────────────────
  if (!PAN_REGEX.test(input.pan)) {
    errors.push('Invalid PAN format. Expected format: ABCDE1234F (5 letters, 4 digits, 1 letter).');
  }

  // ── Rule 4: Applicant must not be unemployed ────────────────────────────
  if (input.employmentMode === EmploymentMode.UNEMPLOYED) {
    errors.push('Unemployed applicants are not eligible for a loan.');
  }

  return {
    passed: errors.length === 0,
    errors,
  };
};
