import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/requestId';
import { httpLogger } from './middleware/logger';
import { standardRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { profileRouter } from './routes/profile';
import { documentRouter } from './routes/documents';
import { schemeRouter } from './routes/schemes';
import { NotFoundError } from './errors/AppError';

export function createApp(): Express {
  const app = express();

  // 1. Request ID Generation & Preservation (First to ensure it tags all downstream handlers)
  app.use(requestIdMiddleware);

  // 2. Structured HTTP Request Logging
  app.use(httpLogger);

  // 3. Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false
    })
  );

  // 4. CORS Allow-List Configuration
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g., server-to-server, curl, tests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || (env.NODE_ENV !== 'production' && env.CORS_ORIGIN === '*')) {
          return callback(null, true);
        }

        return callback(new Error(`CORS policy violation: origin '${origin}' is not allowed`));
      },
      credentials: true
    })
  );

  // 5. Baseline Rate Limiting
  if (env.NODE_ENV !== 'test') {
    app.use(standardRateLimiter);
  }

  // 6. JSON Body Parser with Payload Limit
  app.use(express.json({ limit: '1mb' }));

  // 7. Mount Application Routes
  app.use('/', healthRouter);
  app.use('/', authRouter);
  app.use('/', profileRouter);
  app.use('/', documentRouter);
  app.use('/', schemeRouter);

  // Mount API v1 prefix aliases
  app.use('/api/v1', authRouter);
  app.use('/api/v1', profileRouter);
  app.use('/api/v1', documentRouter);
  app.use('/api/v1', schemeRouter);

  // 8. 404 Catch-All for Undefined Endpoints
  app.use((_req, _res, next) => {
    next(new NotFoundError('The requested API route does not exist'));
  });

  // 9. Centralized Standard Error Handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
