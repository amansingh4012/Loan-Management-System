import { z } from 'zod';
import {
  EmploymentMode,
  PAN_REGEX,
  LOAN_AMOUNT_MIN,
  LOAN_AMOUNT_MAX,
  TENURE_MIN,
  TENURE_MAX,
} from './constants';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password too long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Borrower Profile ──────────────────────────────────────────────────────────

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  pan: z
    .string()
    .length(10, 'PAN must be exactly 10 characters')
    .regex(PAN_REGEX, 'Invalid PAN format (e.g., ABCDE1234F)'),
  dateOfBirth: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date of birth' }
  ),
  monthlySalary: z.number().min(0, 'Salary cannot be negative'),
  employmentMode: z.nativeEnum(EmploymentMode),
});

// ── Loan Application ─────────────────────────────────────────────────────────

export const loanApplicationSchema = z.object({
  loanAmount: z
    .number()
    .min(LOAN_AMOUNT_MIN, `Minimum loan amount is ₹${LOAN_AMOUNT_MIN.toLocaleString()}`)
    .max(LOAN_AMOUNT_MAX, `Maximum loan amount is ₹${LOAN_AMOUNT_MAX.toLocaleString()}`),
  tenureDays: z
    .number()
    .int('Tenure must be a whole number')
    .min(TENURE_MIN, `Minimum tenure is ${TENURE_MIN} days`)
    .max(TENURE_MAX, `Maximum tenure is ${TENURE_MAX} days`),
});

// ── Sanction ──────────────────────────────────────────────────────────────────

export const rejectLoanSchema = z.object({
  rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters').max(500),
});

// ── Payment ───────────────────────────────────────────────────────────────────

export const paymentSchema = z.object({
  utrNumber: z.string().trim().min(1, 'UTR number is required').max(50),
  amount: z.number().positive('Payment amount must be positive'),
  paymentDate: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid payment date' }
  ).refine(
    (val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // allow today
      return date <= today;
    },
    { message: 'Payment date cannot be in the future' }
  ),
});
