import { Router, Request, Response, NextFunction } from 'express';
import { checkDatabaseHealth } from '../db';

export const healthRouter = Router();

healthRouter.get('/health', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const requestId = req.id ?? (req.headers['x-request-id'] as string) ?? 'unknown';

  try {
    const isDbHealthy = await checkDatabaseHealth();

    if (!isDbHealthy) {
      res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database connectivity check failed',
          details: {
            database: 'unavailable'
          },
          requestId
        }
      });
      return;
    }

    res.status(200).json({
      status: 'ok',
      database: 'ok',
      timestamp: new Date().toISOString(),
      requestId
    });
  } catch (err) {
    next(err);
  }
});
