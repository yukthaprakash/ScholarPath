import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { env } from '../config/env';
import { AuthenticationError } from '../errors/AppError';

export interface AuthUser {
  uid: string;
  email?: string;
  mode: 'demo' | 'production';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Lazy initialization of Firebase Admin SDK
let firebaseAppInitialized = false;

function getFirebaseAuth(): admin.auth.Auth {
  if (!firebaseAppInitialized) {
    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
      throw new AuthenticationError('Firebase Admin credentials not configured');
    }

    // Format escaped newlines in private key if present
    const formattedPrivateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: formattedPrivateKey
      })
    });
    firebaseAppInitialized = true;
  }

  return admin.auth();
}

/**
 * Authentication middleware.
 * Supports:
 * - Demo mode: X-Demo-User-Id header for local dev
 * - Production mode: Firebase Bearer ID Token verification
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const demoUserId = req.headers['x-demo-user-id'];
  const authHeader = req.headers.authorization;

  // 1. Guard against demo headers in production
  if (env.AUTH_MODE === 'production' && demoUserId) {
    return next(new AuthenticationError('Demo authentication headers are not permitted in production mode'));
  }

  // 2. Handle Demo Mode
  if (env.AUTH_MODE === 'demo') {
    if (typeof demoUserId === 'string' && demoUserId.trim().length > 0) {
      req.user = {
        uid: demoUserId.trim(),
        email: `${demoUserId.trim()}@scholarpath.demo`,
        mode: 'demo'
      };
      return next();
    }

    // Fallback default demo identity if no header provided in demo mode
    req.user = {
      uid: 'demo-student-001',
      email: 'student@scholarpath.demo',
      mode: 'demo'
    };
    return next();
  }

  // 3. Handle Production Mode (Firebase Bearer Token)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AuthenticationError('Authorization Bearer token is required'));
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next(new AuthenticationError('Bearer token cannot be empty'));
  }

  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      mode: 'production'
    };
    next();
  } catch {
    // Note: Do not log or expose the raw token on verification failure
    next(new AuthenticationError('Invalid or expired authentication token'));
  }
}
