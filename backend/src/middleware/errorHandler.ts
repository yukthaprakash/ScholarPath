import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from './logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id ?? (req.headers['x-request-id'] as string) ?? 'unknown';

  // 1. Handle Known AppError instances
  if (err instanceof AppError) {
    logger.warn({
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      message: err.message
    });

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId
      }
    });
    return;
  }

  // 2. Handle Body Parser / Syntax Errors (e.g., malformed JSON payload)
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    logger.warn({ requestId, err: 'Malformed JSON payload' });
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: 'The request body contains malformed JSON syntax',
        details: {},
        requestId
      }
    });
    return;
  }

  // 3. Handle Direct Zod Validation Errors
  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message
    }));

    logger.warn({ requestId, validationIssues: issues });
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload validation failed',
        details: { issues },
        requestId
      }
    });
    return;
  }

  // 4. Handle Unexpected / Unhandled Internal Errors
  // Log internal diagnostic details securely server-side
  logger.error({
    requestId,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined
  });

  // Strict security: Never expose stack traces, DB credentials, raw SQL, or secrets to client
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred. Please try again later.',
      details: {},
      requestId
    }
  });
}
