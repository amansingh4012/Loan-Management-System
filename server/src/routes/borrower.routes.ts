import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { asyncHandler } from '../middleware/asyncHandler';
import { upload } from '../middleware/upload';
import { UserRole } from '../utils/constants';
import {
  updateProfile,
  uploadSalarySlip,
  applyLoan,
  getMyLoans,
} from '../controllers/borrower.controller';

const router = Router();

// All borrower routes require authentication + borrower role
router.use(authenticate, authorize(UserRole.BORROWER));

router.put('/profile', asyncHandler(updateProfile));
router.post('/upload-salary-slip', upload.single('salarySlip'), asyncHandler(uploadSalarySlip));
router.post('/apply-loan', asyncHandler(applyLoan));
router.get('/my-loans', asyncHandler(getMyLoans));

export default router;
