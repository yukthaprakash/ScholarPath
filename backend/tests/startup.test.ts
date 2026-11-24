import { describe, it, expect } from 'vitest';
import { validateEnv } from '../src/config/env';

describe('Environment Configuration & Startup Validation', () => {
  const minimalValidDemoEnv = {
    PORT: '3001',
    NODE_ENV: 'development',
    AUTH_MODE: 'demo',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/scholarpath_test'
  };

  it('successfully boots in demo mode without GEMINI_API_KEY', () => {
    const config = validateEnv({
      ...minimalValidDemoEnv
      // GEMINI_API_KEY is deliberately omitted
    });

    expect(config.AUTH_MODE).toBe('demo');
    expect(config.GEMINI_API_KEY).toBeUndefined();
    expect(config.PORT).toBe(3001);
  });

  it('successfully boots in demo mode without any Firebase credentials', () => {
    const config = validateEnv({
      ...minimalValidDemoEnv,
      FIREBASE_PROJECT_ID: undefined,
      FIREBASE_CLIENT_EMAIL: undefined,
      FIREBASE_PRIVATE_KEY: undefined
    });

    expect(config.AUTH_MODE).toBe('demo');
    expect(config.FIREBASE_PROJECT_ID).toBeUndefined();
  });

  it('fails validation when AUTH_MODE=production and Firebase credentials are missing', () => {
    expect(() => {
      validateEnv({
        ...minimalValidDemoEnv,
        AUTH_MODE: 'production'
        // Missing FIREBASE_* credentials
      });
    }).toThrowError(/FIREBASE_PROJECT_ID is required when AUTH_MODE=production/);
  });

  it('fails validation when NODE_ENV=production and CORS_ORIGIN is wildcard *', () => {
    expect(() => {
      validateEnv({
        ...minimalValidDemoEnv,
        NODE_ENV: 'production',
        AUTH_MODE: 'production',
        FIREBASE_PROJECT_ID: 'prod-proj',
        FIREBASE_CLIENT_EMAIL: 'admin@prod.iam.gserviceaccount.com',
        FIREBASE_PRIVATE_KEY: 'test-key',
        CORS_ORIGIN: '*'
      });
    }).toThrowError(/Wildcard CORS_ORIGIN is not permitted in production/);
  });

  it('validates production environment correctly when all required variables are supplied', () => {
    const config = validateEnv({
      ...minimalValidDemoEnv,
      NODE_ENV: 'production',
      AUTH_MODE: 'production',
      FIREBASE_PROJECT_ID: 'scholarpath-prod',
      FIREBASE_CLIENT_EMAIL: 'firebase-admin@scholarpath.iam.gserviceaccount.com',
      FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgk...\\n-----END PRIVATE KEY-----',
      CORS_ORIGIN: 'https://scholarpath.app'
    });

    expect(config.NODE_ENV).toBe('production');
    expect(config.AUTH_MODE).toBe('production');
    expect(config.CORS_ORIGIN).toBe('https://scholarpath.app');
  });
});
