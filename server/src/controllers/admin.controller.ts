import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { LoanApplication } from '../models/LoanApplication';
import { LoanStatus, UserRole } from '../utils/constants';
import { ActivityLog, ActivityAction } from '../models/ActivityLog';

/**
 * GET /api/admin/users
 * Lists all users, with optional role filter via query param.
 */
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { role } = req.query;

  const filter: Record<string, any> = {};
  if (role && Object.values(UserRole).includes(role as UserRole)) {
    filter.role = role;
  }

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({ users, count: users.length });
};

/**
 * GET /api/admin/stats
 * Returns aggregated dashboard statistics.
 */
export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [
    totalUsers,
    totalBorrowers,
    totalLoans,
    loansByStatus,
    totalDisbursedAmount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: UserRole.BORROWER }),
    LoanApplication.countDocuments(),
    LoanApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    LoanApplication.aggregate([
      { $match: { status: { $in: [LoanStatus.DISBURSED, LoanStatus.CLOSED] } } },
      { $group: { _id: null, total: { $sum: '$loanAmount' } } },
    ]),
  ]);

  const statusCounts = loansByStatus.reduce(
    (acc: Record<string, number>, item: { _id: string; count: number }) => {
      acc[item._id] = item.count;
      return acc;
    },
    {}
  );

  res.json({
    totalUsers,
    totalBorrowers,
    totalLoans,
    loansByStatus: statusCounts,
    totalDisbursedAmount: totalDisbursedAmount[0]?.total || 0,
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY HISTORY — Full audit trail for admin
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/history
 * Returns paginated activity logs with optional action filter.
 *
 * Query params:
 *   page   — 1-indexed page number (default: 1)
 *   limit  — items per page, capped at 100 (default: 25)
 *   action — filter by ActivityAction enum value (optional)
 */
export const getActivityHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 25));
  const { action } = req.query;

  const filter: Record<string, any> = {};
  if (action && Object.values(ActivityAction).includes(action as ActivityAction)) {
    filter.action = action;
  }

  const [logs, totalCount] = await Promise.all([
    ActivityLog.find(filter)
      .populate('performedBy', 'fullName email role')
      .populate('targetLoan', 'loanAmount status totalRepayment')
      .populate('targetUser', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  res.json({
    logs,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page * limit < totalCount,
      hasPrev: page > 1,
    },
  });
};
