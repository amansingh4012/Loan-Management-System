import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '../utils/constants';

/**
 * Factory function that returns middleware enforcing role-based access.
 * Usage: `authorize(UserRole.SANCTION, UserRole.ADMIN)`
 *
 * Returns 403 Forbidden if the authenticated user's role is not in the allowed list.
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        message: 'Access denied. You do not have permission to access this resource.',
      });
      return;
    }

    next();
  };
};
