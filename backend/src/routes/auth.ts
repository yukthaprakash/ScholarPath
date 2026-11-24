import { Router, Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { requireAuth } from '../middleware/auth';
import { upsertUser } from '../services/userService';
import { createSessionSchema } from '../schemas/authSchema';
import { AuthenticationError } from '../errors/AppError';

export const authRouter = Router();

/**
 * POST /auth/session
 * Initializes or verifies user session and records user identity in the database.
 * Supports:
 * - Demo mode: X-Demo-User-Id header or body
 * - Production mode: Firebase ID Token
 */
authRouter.post('/auth/session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Validate session input payload
    createSessionSchema.parse(req.body ?? {});

    const demoUserId = req.headers['x-demo-user-id'];

    // 2. Reject demo identity in production mode
    if (env.AUTH_MODE === 'production' && demoUserId) {
      throw new AuthenticationError('Demo authentication headers are not permitted in production mode');
    }

    // 3. Authenticate request user via requireAuth middleware logic
    await new Promise<void>((resolve, reject) => {
      requireAuth(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (!req.user) {
      throw new AuthenticationError('Authentication failed');
    }

    // 4. Create or update users table record
    const userRecord = await upsertUser(req.user.uid, req.user.email, req.user.mode);

    res.status(200).json({
      user: userRecord
    });
  } catch (err) {
    next(err);
  }
});
