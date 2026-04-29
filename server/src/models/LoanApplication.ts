import mongoose, { Schema, Document, Types } from 'mongoose';
import { LoanStatus } from '../utils/constants';

export interface ILoanApplication extends Document {
  borrower: Types.ObjectId;
  loanAmount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  outstandingBalance: number;
  salarySlipUrl: string;
  salarySlipOriginalName: string;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const loanApplicationSchema = new Schema<ILoanApplication>(
  {
    borrower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    loanAmount: { type: Number, required: true },
    tenureDays: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    outstandingBalance: { type: Number, required: true },
    salarySlipUrl: { type: String, required: true },
    salarySlipOriginalName: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      default: LoanStatus.APPLIED,
      index: true,
    },
    rejectionReason: { type: String },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for efficient dashboard queries
loanApplicationSchema.index({ status: 1, createdAt: -1 });

export const LoanApplication = mongoose.model<ILoanApplication>(
  'LoanApplication',
  loanApplicationSchema
);
