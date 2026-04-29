import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';

/**
 * Global error handler — catches Zod validation errors, Multer errors,
 * and any unhandled exceptions, returning consistent JSON responses.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({ message: 'Validation failed', errors });
    return;
  }

  // Multer file upload errors
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File too large. Maximum size is 5 MB.' });
      return;
    }
    res.status(400).json({ message: `Upload error: ${err.message}` });
    return;
  }

  // Multer custom filter error
  if (err.message?.includes('Invalid file type')) {
    res.status(400).json({ message: err.message });
    return;
  }

  // MongoDB duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
    res.status(409).json({ message: `Duplicate value for ${field}. This value already exists.` });
    return;
  }

  // Default server error
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
};
