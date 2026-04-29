export enum UserRole {
  ADMIN = 'admin',
  SALES = 'sales',
  SANCTION = 'sanction',
  DISBURSEMENT = 'disbursement',
  COLLECTION = 'collection',
  BORROWER = 'borrower',
}

export enum LoanStatus {
  APPLIED = 'applied',
  SANCTIONED = 'sanctioned',
  REJECTED = 'rejected',
  DISBURSED = 'disbursed',
  CLOSED = 'closed',
}

export enum EmploymentMode {
  SALARIED = 'salaried',
  SELF_EMPLOYED = 'self-employed',
  UNEMPLOYED = 'unemployed',
}

/** Fixed interest rate: 12% per annum */
export const INTEREST_RATE = 12;

/** Loan amount bounds (in INR) */
export const LOAN_AMOUNT_MIN = 50_000;
export const LOAN_AMOUNT_MAX = 500_000;

/** Tenure bounds (in days) */
export const TENURE_MIN = 30;
export const TENURE_MAX = 365;

/** BRE thresholds */
export const BRE_MIN_AGE = 23;
export const BRE_MAX_AGE = 50;
export const BRE_MIN_SALARY = 25_000;

/** PAN format: 5 uppercase letters, 4 digits, 1 uppercase letter */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/** Upload limits */
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
