import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { evaluateEligibilitySchema, explainEligibilitySchema } from '../schemas/eligibilitySchema';
import { getProfileByUserId } from '../services/profileService';
import { getDocumentsByUserId } from '../services/documentService';
import { engineAdapter } from '../services/engineAdapter';
import { explainEligibility } from '../services/aiExplanationService';
import { AuthenticationError, NotFoundError } from '../errors/AppError';

export const eligibilityRouter = Router();

/**
 * POST /eligibility/evaluate
 * Evaluates the authenticated student's Eligibility DNA and document passport
 * against verified government scholarship schemes using the pure TypeScript rule engine.
 *
 * Request Body (optional):
 * - schemeSlug?: string (evaluate a single specific scheme instead of all schemes)
 * - today?: string (ISO date string YYYY-MM-DD, defaults to 2026-10-05)
 */
eligibilityRouter.post('/eligibility/evaluate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required to evaluate eligibility');
    }

    const userId = req.user.uid;
    const validatedInput = evaluateEligibilitySchema.parse(req.body ?? {});

    // 1. Fetch user profile
    const profile = await getProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundError('Student profile not found. Please create a profile before evaluating eligibility.');
    }

    // 2. Fetch user documents
    const documents = await getDocumentsByUserId(userId);

    // 3. Evaluate eligibility via engine adapter
    const evaluation = await engineAdapter.evaluate({
      profile,
      documents,
      schemeSlug: validatedInput.schemeSlug,
      today: validatedInput.today
    });

    res.status(200).json(evaluation);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /eligibility/explain
 * Generates an authoritative, grounded plain-language explanation of eligibility
 * for the authenticated student using the rule engine evaluation and Gemini AI with safety guards.
 *
 * Request Body (optional):
 * - schemeSlug?: string (explain a specific scheme match, or omit to explain all matches)
 * - language?: 'en' | 'kn' | 'hi' (default: 'en')
 * - today?: string (ISO date string YYYY-MM-DD, defaults to 2026-10-05)
 */
eligibilityRouter.post('/eligibility/explain', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required to explain eligibility');
    }

    const userId = req.user.uid;
    const validatedInput = explainEligibilitySchema.parse(req.body ?? {});

    const result = await explainEligibility({
      userId,
      schemeSlug: validatedInput.schemeSlug,
      language: validatedInput.language,
      today: validatedInput.today
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

