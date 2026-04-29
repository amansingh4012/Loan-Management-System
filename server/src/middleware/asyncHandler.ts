import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async Express route handler so that any thrown/rejected error
 * is automatically forwarded to Express's error-handling middleware via next().
 *
 * Without this, Express 4 silently drops errors from async handlers,
 * causing the client to hang or receive no response.
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
