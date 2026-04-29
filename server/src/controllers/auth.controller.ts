import { Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { env } from '../config/env';
import { UserRole } from '../utils/constants';
import { registerSchema, loginSchema } from '../utils/validators';

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * POST /api/auth/register
 * Creates a new borrower account.
 */
export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = registerSchema.parse(req.body);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409).json({ message: 'An account with this email already exists.' });
    return;
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    email,
    password: hashedPassword,
    role: UserRole.BORROWER,
  });

  const token = generateToken((user._id as mongoose.Types.ObjectId).toString());

  res.status(201).json({
    message: 'Account created successfully.',
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
    },
  });
};

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT.
 */
export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = loginSchema.parse(req.body);

  // Must explicitly select password since it's excluded by default
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    res.status(401).json({ message: 'Invalid email or password.' });
    return;
  }

  const token = generateToken((user._id as mongoose.Types.ObjectId).toString());

  res.json({
    message: 'Login successful.',
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      profileCompleted: user.profileCompleted,
    },
  });
};

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ user: req.user });
};
