import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { LoanApplication } from '../models/LoanApplication';
import { Payment } from '../models/Payment';
import { LoanStatus, UserRole } from '../utils/constants';
import { rejectLoanSchema, paymentSchema } from '../utils/validators';
import { logActivity, ActivityAction } from '../services/history.service';

// ═══════════════════════════════════════════════════════════════════════════════
// SALES MODULE — Lead tracking (registered but haven't applied)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dashboard/sales/leads
 * Returns borrowers who registered but have no loan applications yet.
 */
export const getLeads = async (_req: AuthRequest, res: Response): Promise<void> => {
  const borrowersWithLoans = await LoanApplication.distinct('borrower');

  const leads = await User.find({
    role: UserRole.BORROWER,
    _id: { $nin: borrowersWithLoans },
  })
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({ leads, count: leads.length });
};

// ═══════════════════════════════════════════════════════════════════════════════
// SANCTION MODULE — Review and approve/reject applications
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dashboard/sanction/applications
 * Returns all loan applications with status "applied".
 * Includes borrower details + salary slip for executive review.
 */
export const getApplicationsForSanction = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  const applications = await LoanApplication.find({ status: LoanStatus.APPLIED })
    .populate('borrower', 'fullName email pan monthlySalary employmentMode dateOfBirth')
    .sort({ createdAt: -1 });

  res.json({ applications, count: applications.length });
};

/**
 * PATCH /api/dashboard/sanction/applications/:id/approve
 * Transitions loan from APPLIED → SANCTIONED.
 */
export const approveLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await LoanApplication.findById(req.params.id);

  if (!loan) {
    res.status(404).json({ message: 'Loan application not found.' });
    return;
  }

  if (loan.status !== LoanStatus.APPLIED) {
    res.status(400).json({
      message: `Cannot approve a loan with status "${loan.status}". Only "applied" loans can be approved.`,
    });
    return;
  }

  loan.status = LoanStatus.SANCTIONED;
  loan.sanctionedBy = req.user!._id;
  loan.sanctionedAt = new Date();
  await loan.save();

  logActivity({
    action: ActivityAction.LOAN_SANCTIONED,
    performedBy: req.user!._id,
    targetLoan: loan._id,
    targetUser: loan.borrower,
    metadata: { loanAmount: loan.loanAmount },
  });

  res.json({ message: 'Loan approved (sanctioned) successfully.', loan });
};

/**
 * PATCH /api/dashboard/sanction/applications/:id/reject
 * Transitions loan from APPLIED → REJECTED (requires reason).
 */
export const rejectLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  const { rejectionReason } = rejectLoanSchema.parse(req.body);

  const loan = await LoanApplication.findById(req.params.id);

  if (!loan) {
    res.status(404).json({ message: 'Loan application not found.' });
    return;
  }

  if (loan.status !== LoanStatus.APPLIED) {
    res.status(400).json({
      message: `Cannot reject a loan with status "${loan.status}". Only "applied" loans can be rejected.`,
    });
    return;
  }

  loan.status = LoanStatus.REJECTED;
  loan.rejectionReason = rejectionReason;
  loan.sanctionedBy = req.user!._id;
  loan.sanctionedAt = new Date();
  await loan.save();

  logActivity({
    action: ActivityAction.LOAN_REJECTED,
    performedBy: req.user!._id,
    targetLoan: loan._id,
    targetUser: loan.borrower,
    metadata: { loanAmount: loan.loanAmount, rejectionReason },
  });

  res.json({ message: 'Loan rejected.', loan });
};

// ═══════════════════════════════════════════════════════════════════════════════
// DISBURSEMENT MODULE — Mark sanctioned loans as disbursed
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dashboard/disbursement/loans
 * Returns all loans with status "sanctioned".
 */
export const getLoansForDisbursement = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  const loans = await LoanApplication.find({ status: LoanStatus.SANCTIONED })
    .populate('borrower', 'fullName email pan')
    .populate('sanctionedBy', 'fullName email')
    .sort({ createdAt: -1 });

  res.json({ loans, count: loans.length });
};

/**
 * PATCH /api/dashboard/disbursement/loans/:id/disburse
 * Transitions loan from SANCTIONED → DISBURSED.
 */
export const disburseLoan = async (req: AuthRequest, res: Response): Promise<void> => {
  const loan = await LoanApplication.findById(req.params.id);

  if (!loan) {
    res.status(404).json({ message: 'Loan application not found.' });
    return;
  }

  if (loan.status !== LoanStatus.SANCTIONED) {
    res.status(400).json({
      message: `Cannot disburse a loan with status "${loan.status}". Only "sanctioned" loans can be disbursed.`,
    });
    return;
  }

  loan.status = LoanStatus.DISBURSED;
  loan.disbursedBy = req.user!._id;
  loan.disbursedAt = new Date();
  await loan.save();

  logActivity({
    action: ActivityAction.LOAN_DISBURSED,
    performedBy: req.user!._id,
    targetLoan: loan._id,
    targetUser: loan.borrower,
    metadata: { loanAmount: loan.loanAmount },
  });

  res.json({ message: 'Loan disbursed successfully.', loan });
};

// ═══════════════════════════════════════════════════════════════════════════════
// COLLECTION MODULE — Record payments on disbursed loans
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/dashboard/collection/loans
 * Returns all loans with status "disbursed" (active loans needing collection).
 */
export const getLoansForCollection = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  const loans = await LoanApplication.find({ status: LoanStatus.DISBURSED })
    .populate('borrower', 'fullName email pan')
    .sort({ createdAt: -1 });

  res.json({ loans, count: loans.length });
};

/**
 * POST /api/dashboard/collection/loans/:id/payment
 * Records a borrower payment. Auto-closes loan if fully paid.
 */
export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { utrNumber, amount, paymentDate } = paymentSchema.parse(req.body);

  const loan = await LoanApplication.findById(req.params.id);

  if (!loan) {
    res.status(404).json({ message: 'Loan application not found.' });
    return;
  }

  if (loan.status !== LoanStatus.DISBURSED) {
    res.status(400).json({
      message: `Cannot record payment for a loan with status "${loan.status}". Only "disbursed" loans accept payments.`,
    });
    return;
  }

  // Validate payment amount against outstanding balance
  if (amount > loan.outstandingBalance) {
    res.status(400).json({
      message: `Payment amount (₹${amount}) exceeds outstanding balance (₹${loan.outstandingBalance}).`,
    });
    return;
  }

  // Check UTR uniqueness (also enforced by DB unique index)
  const existingPayment = await Payment.findOne({ utrNumber });
  if (existingPayment) {
    res.status(409).json({ message: `A payment with UTR "${utrNumber}" already exists.` });
    return;
  }

  // Create payment record
  const payment = await Payment.create({
    loanApplication: loan._id,
    utrNumber,
    amount,
    paymentDate: new Date(paymentDate),
    recordedBy: req.user!._id,
  });

  // Update outstanding balance
  loan.outstandingBalance = Math.round((loan.outstandingBalance - amount) * 100) / 100;

  // Auto-close if fully paid
  const autoClosed = loan.outstandingBalance <= 0;
  if (autoClosed) {
    loan.outstandingBalance = 0;
    loan.status = LoanStatus.CLOSED;
    loan.closedAt = new Date();
  }

  await loan.save();

  // Log the payment
  logActivity({
    action: ActivityAction.PAYMENT_RECORDED,
    performedBy: req.user!._id,
    targetLoan: loan._id,
    targetUser: loan.borrower,
    metadata: { utrNumber, amount, paymentDate },
  });

  // If auto-closed, log that separately
  if (autoClosed) {
    logActivity({
      action: ActivityAction.LOAN_CLOSED,
      performedBy: req.user!._id,
      targetLoan: loan._id,
      targetUser: loan.borrower,
      metadata: { totalRepayment: loan.totalRepayment },
    });
  }

  res.status(201).json({
    message:
      loan.status === LoanStatus.CLOSED
        ? 'Payment recorded. Loan is now fully paid and closed.'
        : 'Payment recorded successfully.',
    payment,
    loan: {
      status: loan.status,
      outstandingBalance: loan.outstandingBalance,
      totalRepayment: loan.totalRepayment,
    },
  });
};

/**
 * GET /api/dashboard/collection/loans/:id/payments
 * Returns all payments for a specific loan.
 */
export const getLoanPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const payments = await Payment.find({ loanApplication: req.params.id })
    .populate('recordedBy', 'fullName email')
    .sort({ paymentDate: -1 });

  const loan = await LoanApplication.findById(req.params.id).select(
    'totalRepayment outstandingBalance status'
  );

  res.json({
    payments,
    count: payments.length,
    loanSummary: loan
      ? {
          totalRepayment: loan.totalRepayment,
          outstandingBalance: loan.outstandingBalance,
          totalPaid: loan.totalRepayment - loan.outstandingBalance,
          status: loan.status,
        }
      : null,
  });
};
