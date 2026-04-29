import { Types } from 'mongoose';
import { ActivityLog, ActivityAction } from '../models/ActivityLog';

interface LogActivityParams {
  action: ActivityAction;
  performedBy: Types.ObjectId | string;
  targetLoan?: Types.ObjectId | string;
  targetUser?: Types.ObjectId | string;
  metadata?: Record<string, any>;
}

/**
 * Centralized activity logger.
 *
 * Fire-and-forget — logs are written asynchronously and never block
 * the caller's response. Failures are swallowed and logged to stderr
 * so they don't crash the request handler.
 */
export const logActivity = (params: LogActivityParams): void => {
  ActivityLog.create({
    action: params.action,
    performedBy: params.performedBy,
    targetLoan: params.targetLoan || undefined,
    targetUser: params.targetUser || undefined,
    metadata: params.metadata || {},
  }).catch((err) => {
    // Never let logging failures propagate — log to stderr and move on
    console.error('[ActivityLog] Failed to write log entry:', err.message);
  });
};

export { ActivityAction };
