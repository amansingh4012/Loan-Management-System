import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, EmploymentMode } from '../utils/constants';

export interface IUser extends Document {
  email: string;
  password: string;
  role: UserRole;
  fullName?: string;
  pan?: string;
  dateOfBirth?: Date;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  profileCompleted: boolean;
  salarySlipUrl?: string;
  salarySlipOriginalName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Exclude from queries by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.BORROWER,
      index: true,
    },
    fullName: { type: String, trim: true },
    pan: { type: String, uppercase: true, trim: true },
    dateOfBirth: { type: Date },
    monthlySalary: { type: Number },
    employmentMode: {
      type: String,
      enum: Object.values(EmploymentMode),
    },
    profileCompleted: { type: Boolean, default: false },
    salarySlipUrl: { type: String },
    salarySlipOriginalName: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
