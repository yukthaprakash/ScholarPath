import { Router, Request, Response, NextFunction } from 'express';
import { schemeQuerySchema } from '../schemas/schemeSchema';
import { getSchemes, getSchemeBySlug } from '../services/schemeService';
import { NotFoundError } from '../errors/AppError';

export const schemeRouter = Router();

/**
 * GET /schemes
 * Full-text search, multi-field filtering, pagination, and sorting for schemes.
 * Does NOT calculate eligibility.
 */
schemeRouter.get('/schemes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = schemeQuerySchema.parse(req.query);
    const result = await getSchemes(validatedQuery);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /schemes/:slug
 * Retrieves scheme details, rules, documents, sources, and trust data by slug.
 */
schemeRouter.get('/schemes/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug;
    if (!slug) {
      throw new NotFoundError('Scheme slug parameter is required');
    }
    const scheme = await getSchemeBySlug(slug);

    res.status(200).json({
      scheme
    });
  } catch (err) {
    next(err);
  }
});
