import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db';
import { User } from './models/User';
import { UserRole } from './utils/constants';

/**
 * Seed script — creates one account per role with known credentials.
 * Safe to run multiple times (uses upsert).
 *
 * Usage: npm run seed
 */
const SEED_USERS = [
  {
    email: 'admin@creditsea.com',
    password: 'Password@123',
    role: UserRole.ADMIN,
    fullName: 'Admin User',
  },
  {
    email: 'sales@creditsea.com',
    password: 'Password@123',
    role: UserRole.SALES,
    fullName: 'Sales Executive',
  },
  {
    email: 'sanction@creditsea.com',
    password: 'Password@123',
    role: UserRole.SANCTION,
    fullName: 'Sanction Executive',
  },
  {
    email: 'disbursement@creditsea.com',
    password: 'Password@123',
    role: UserRole.DISBURSEMENT,
    fullName: 'Disbursement Executive',
  },
  {
    email: 'collection@creditsea.com',
    password: 'Password@123',
    role: UserRole.COLLECTION,
    fullName: 'Collection Executive',
  },
  {
    email: 'borrower@creditsea.com',
    password: 'Password@123',
    role: UserRole.BORROWER,
    fullName: 'Test Borrower',
  },
];

const seed = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('\n🌱 Seeding database...\n');

    for (const userData of SEED_USERS) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      await User.findOneAndUpdate(
        { email: userData.email },
        {
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          fullName: userData.fullName,
          profileCompleted: userData.role !== UserRole.BORROWER, // Executives don't need profile
        },
        { upsert: true, new: true }
      );

      console.log(`  ✅ ${userData.role.padEnd(14)} → ${userData.email} / ${userData.password}`);
    }

    console.log('\n✨ Seed complete!\n');
    console.log('┌──────────────────────────────────────────────────────────────┐');
    console.log('│  Login Credentials (all passwords: Password@123)            │');
    console.log('├──────────────┬───────────────────────────────────────────────┤');
    console.log('│  Role        │  Email                                       │');
    console.log('├──────────────┼───────────────────────────────────────────────┤');
    SEED_USERS.forEach((u) => {
      console.log(`│  ${u.role.padEnd(12)}│  ${u.email.padEnd(45)}│`);
    });
    console.log('└──────────────┴───────────────────────────────────────────────┘');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
