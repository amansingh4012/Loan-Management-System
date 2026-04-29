import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { LoanApplication } from '../models/LoanApplication';
import { profileSchema, loanApplicationSchema } from '../utils/validators';
import { evaluateBRE } from '../services/bre.service';
import { calculateLoan } from '../services/loan.service';
import { LoanStatus, INTEREST_RATE } from '../utils/constants';
import { logActivity, ActivityAction } from '../services/history.service';

/**
 * PUT /api/borrower/profile
 * Step 2 — Saves personal details and runs BRE eligibility check.
 * All BRE rules must pass before the profile is saved.
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = profileSchema.parse(req.body);

  // Run BRE — server-side only (authoritative check, prevents client bypass)
  const breResult = evaluateBRE({
    dateOfBirth: data.dateOfBirth,
    monthlySalary: data.monthlySalary,
    pan: data.pan,
    employmentMode: data.employmentMode,
  });

  if (!breResult.passed) {
    res.status(400).json({
      message: 'Eligibility check failed. You are not eligible for a loan.',
      errors: breResult.errors,
    });
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    {
      fullName: data.fullName,
      pan: data.pan.toUpperCase(),
      dateOfBirth: new Date(data.dateOfBirth),
      monthlySalary: data.monthlySalary,
      employmentMode: data.employmentMode,
      profileCompleted: true,
    },
    { new: true }
  );

  res.json({
    message: 'Profile updated and eligibility check passed.',
    user,
  });
};

/**
 * POST /api/borrower/upload-salary-slip
 * Step 3 — Handles salary slip file upload.
 *
 * LINKING LOGIC:
 * The salary slip is uploaded BEFORE the LoanApplication exists (Step 3 comes
 * before Step 4). So we use the User document as a staging area:
 *   1. Upload → file saved to disk, URL stored on User.salarySlipUrl
 *   2. Apply (Step 4) → copies User.salarySlipUrl into the new LoanApplication
 *   3. After apply → clears the staging fields on User
 *
 * This ensures:
 *   - The server is the source of truth (client can't fake a filename)
 *   - Each LoanApplication has its own linked salary slip
 *   - Profile must be completed before uploading (enforces step order)
 */
export const uploadSalarySlip = async (req: AuthRequest, res: Response): Promise<void> => {
  // Enforce step order: profile must be completed before upload
  if (!req.user!.profileCompleted) {
    res.status(400).json({ message: 'Please complete your profile (Step 2) before uploading a salary slip.' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded. Please upload a salary slip (PDF/JPG/PNG, max 5MB).' });
    return;
  }

  // Stage the salary slip on the User document (will be linked to LoanApplication in Step 4)
  await User.findByIdAndUpdate(req.user!._id, {
    salarySlipUrl: `/uploads/${req.file.filename}`,
    salarySlipOriginalName: req.file.originalname,
  });

  res.json({
    message: 'Salary slip uploaded successfully.',
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    },
  });
};

/**
 * POST /api/borrower/apply-loan
 * Step 4 — Creates a loan application with calculated interest.
 *
 * LINKING LOGIC:
 * Reads the staged salary slip URL from User document and copies it into
 * the new LoanApplication. Then clears the staging fields on User so the
 * next application requires a fresh upload.
 */
export const applyLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { loanAmount, tenureDays } = loanApplicationSchema.parse(req.body);

  // Re-fetch user to get latest profile + salary slip data
  const user = await User.findById(req.user!._id);
  if (!user) {
    res.status(401).json({ message: 'User not found.' });
    return;
  }

  // Enforce step order: profile must be completed
  if (!user.profileCompleted) {
    res.status(400).json({ message: 'Please complete your profile before applying for a loan.' });
    return;
  }

  // Enforce step order: salary slip must be uploaded
  if (!user.salarySlipUrl) {
    res.status(400).json({ message: 'Please upload your salary slip before applying.' });
    return;
  }

  // Calculate loan math
  const { simpleInterest, totalRepayment } = calculateLoan(loanAmount, tenureDays);

  // Create loan application with the salary slip LINKED to it
  const loan = await LoanApplication.create({
    borrower: user._id,
    loanAmount,
    tenureDays,
    interestRate: INTEREST_RATE,
    simpleInterest,
    totalRepayment,
    outstandingBalance: totalRepayment,
    salarySlipUrl: user.salarySlipUrl,
    salarySlipOriginalName: user.salarySlipOriginalName || 'salary-slip',
    status: LoanStatus.APPLIED,
  });

  // Clear staged salary slip from User — next application needs a fresh upload
  await User.findByIdAndUpdate(user._id, {
    $unset: { salarySlipUrl: '', salarySlipOriginalName: '' },
  });

  logActivity({
    action: ActivityAction.LOAN_APPLIED,
    performedBy: user._id,
    targetLoan: loan._id,
    targetUser: user._id,
    metadata: { loanAmount, tenureDays, totalRepayment },
  });

  res.status(201).json({
    message: 'Loan application submitted successfully.',
    loan,
  });
};

/**
 * GET /api/borrower/my-loans
 * Returns all loan applications for the authenticated borrower.
 */
export const getMyLoans = async (req: AuthRequest, res: Response): Promise<void> => {
  const loans = await LoanApplication.find({ borrower: req.user!._id })
    .sort({ createdAt: -1 });

  res.json({ loans });
};
