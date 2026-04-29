import mongoose from 'mongoose';
import dns from 'dns';
import { env } from './env';

// Force Google DNS for SRV record resolution (fixes local DNS blocking Atlas)
dns.setServers(['8.8.8.8', '8.8.4.4']);

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
