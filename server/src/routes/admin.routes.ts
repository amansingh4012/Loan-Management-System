import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { asyncHandler } from '../middleware/asyncHandler';
import { UserRole } from '../utils/constants';
import { getUsers, getStats, getActivityHistory } from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/users', asyncHandler(getUsers));
router.get('/stats', asyncHandler(getStats));
router.get('/history', asyncHandler(getActivityHistory));

export default router;

