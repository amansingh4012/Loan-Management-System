import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { asyncHandler } from '../middleware/asyncHandler';
import { UserRole } from '../utils/constants';
import {
  getLeads,
  getApplicationsForSanction,
  approveLoan,
  rejectLoan,
  getLoansForDisbursement,
  disburseLoan,
  getLoansForCollection,
  recordPayment,
  getLoanPayments,
} from '../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// ── Sales Module ──────────────────────────────────────────────────────────────
router.get('/sales/leads', authorize(UserRole.SALES, UserRole.ADMIN), asyncHandler(getLeads));

// ── Sanction Module ───────────────────────────────────────────────────────────
router.get(
  '/sanction/applications',
  authorize(UserRole.SANCTION, UserRole.ADMIN),
  asyncHandler(getApplicationsForSanction)
);
router.patch(
  '/sanction/applications/:id/approve',
  authorize(UserRole.SANCTION, UserRole.ADMIN),
  asyncHandler(approveLoan)
);
router.patch(
  '/sanction/applications/:id/reject',
  authorize(UserRole.SANCTION, UserRole.ADMIN),
  asyncHandler(rejectLoan)
);

// ── Disbursement Module ───────────────────────────────────────────────────────
router.get(
  '/disbursement/loans',
  authorize(UserRole.DISBURSEMENT, UserRole.ADMIN),
  asyncHandler(getLoansForDisbursement)
);
router.patch(
  '/disbursement/loans/:id/disburse',
  authorize(UserRole.DISBURSEMENT, UserRole.ADMIN),
  asyncHandler(disburseLoan)
);

// ── Collection Module ─────────────────────────────────────────────────────────
router.get(
  '/collection/loans',
  authorize(UserRole.COLLECTION, UserRole.ADMIN),
  asyncHandler(getLoansForCollection)
);
router.post(
  '/collection/loans/:id/payment',
  authorize(UserRole.COLLECTION, UserRole.ADMIN),
  asyncHandler(recordPayment)
);
router.get(
  '/collection/loans/:id/payments',
  authorize(UserRole.COLLECTION, UserRole.ADMIN),
  asyncHandler(getLoanPayments)
);

export default router;
