import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  loanApplication: Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  recordedBy: Types.ObjectId;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    loanApplication: {
      type: Schema.Types.ObjectId,
      ref: 'LoanApplication',
      required: true,
      index: true,
    },
    utrNumber: {
      type: String,
      required: true,
      unique: true, // Enforces no duplicate UTR across the entire system
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Payment amount must be positive'],
    },
    paymentDate: { type: Date, required: true },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
