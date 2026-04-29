import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * All trackable actions in the loan lifecycle.
 * Each maps to a specific controller action.
 */
export enum ActivityAction {
  USER_REGISTERED = 'USER_REGISTERED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  LOAN_APPLIED = 'LOAN_APPLIED',
  LOAN_SANCTIONED = 'LOAN_SANCTIONED',
  LOAN_REJECTED = 'LOAN_REJECTED',
  LOAN_DISBURSED = 'LOAN_DISBURSED',
  PAYMENT_RECORDED = 'PAYMENT_RECORDED',
  LOAN_CLOSED = 'LOAN_CLOSED',
}

export interface IActivityLog extends Document {
  action: ActivityAction;
  performedBy: Types.ObjectId;
  targetLoan?: Types.ObjectId;
  targetUser?: Types.ObjectId;
  metadata: Record<string, any>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    action: {
      type: String,
      enum: Object.values(ActivityAction),
      required: true,
      index: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetLoan: {
      type: Schema.Types.ObjectId,
      ref: 'LoanApplication',
      index: true,
    },
    targetUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for the admin history query (most recent first + filter by action)
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>(
  'ActivityLog',
  activityLogSchema
);
