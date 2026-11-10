import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { updateProfileSchema } from '../schemas/profileSchema';
import { getProfileByUserId, upsertProfile } from '../services/profileService';
import { AuthenticationError } from '../errors/AppError';

export const profileRouter = Router();

/**
 * GET /profile
 * Retrieves the Eligibility DNA profile for the authenticated user.
 */
profileRouter.get('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required to access profile');
    }

    const userId = req.user.uid;
    const profile = await getProfileByUserId(userId);

    res.status(200).json({
      profile: profile ?? { userId }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /profile
 * Updates the Eligibility DNA profile for the authenticated user.
 * Strictly validates inputs using Zod. Does not decide eligibility.
 */
profileRouter.put('/profile', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required to update profile');
    }

    const validatedInput = updateProfileSchema.parse(req.body);
    const updatedProfile = await upsertProfile(req.user.uid, validatedInput);

    res.status(200).json({
      profile: updatedProfile
    });
  } catch (err) {
    next(err);
  }
});
