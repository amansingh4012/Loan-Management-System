import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth.routes';
import borrowerRoutes from './routes/borrower.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminRoutes from './routes/admin.routes';


const app = express();

// ── Core Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static file serving for uploads ───────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/borrower', borrowerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

// ── API 404 — catch any unmatched /api/* requests ─────────────────────────────
app.all('/api/*', (_req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

// ── Static Frontend Serving (Production) ──────────────────────────────────────
// In production, Express serves the Next.js static export from client/out/
const clientBuildPath = path.join(__dirname, '../../client/out');

if (fs.existsSync(clientBuildPath)) {
  // Serve static assets (JS, CSS, images, fonts, etc.)
  app.use(express.static(clientBuildPath, { extensions: ['html'] }));

  // SPA fallback — serve index.html for all unmatched GET requests
  // Next.js client-side router handles the actual routing
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });

  console.log('📦 Serving static frontend from client/out/');
} else {
  // Development mode — no built frontend, API-only
  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found.' });
  });
}

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`📋 API Health: http://localhost:${env.PORT}/api/health\n`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
