import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Safe alphanumeric request ID pattern (8 to 64 chars)
const SAFE_REQUEST_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];

  let requestId: string;
  if (typeof incomingId === 'string' && SAFE_REQUEST_ID_REGEX.test(incomingId)) {
    requestId = incomingId;
  } else {
    requestId = crypto.randomUUID();
  }

  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
