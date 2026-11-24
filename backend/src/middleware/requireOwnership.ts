import { Request, Response, NextFunction } from 'express';
import { AuthorizationError, AuthenticationError } from '../errors/AppError';

/**
 * Reusable ownership assertion helper.
 * Validates that the authenticated user UID matches the target resource owner ID.
 *
 * Core Tenancy Invariant:
 * authenticated user UID === resource.user_id
 */
export function assertOwnership(req: Request, resourceUserId: string): void {
  if (!req.user) {
    throw new AuthenticationError('Authentication required to verify resource ownership');
  }

  if (req.user.uid !== resourceUserId) {
    throw new AuthorizationError('You do not have permission to access or modify this resource');
  }
}

/**
 * Express middleware factory to assert ownership based on route parameters.
 * Example usage: router.get('/profile/:userId', requireAuth, requireParamOwnership('userId'), handler);
 */
export function requireParamOwnership(paramName = 'userId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const targetUserId = req.params[paramName];
      if (!targetUserId) {
        throw new AuthorizationError(`Missing required route parameter '${paramName}' for ownership check`);
      }

      assertOwnership(req, targetUserId);
      next();
    } catch (err) {
      next(err);
    }
  };
}
