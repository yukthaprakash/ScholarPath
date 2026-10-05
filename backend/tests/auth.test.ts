import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { requireAuth } from '../src/middleware/auth';
import { assertOwnership } from '../src/middleware/requireOwnership';
import { errorHandler } from '../src/middleware/errorHandler';
import { requestIdMiddleware } from '../src/middleware/requestId';
import * as envModule from '../src/config/env';

describe('Authentication & Authorization Middleware', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function createTestAuthApp() {
    const app = express();
    app.use(requestIdMiddleware);
    app.use(express.json());

    // Protected dummy route
    app.get('/protected', requireAuth, (req: Request, res: Response) => {
      res.status(200).json({
        user: req.user
      });
    });

    // Protected dummy route with ownership verification
    app.get('/protected/:ownerId', requireAuth, (req: Request, res: Response) => {
      assertOwnership(req, req.params.ownerId as string);
      res.status(200).json({ success: true, owner: req.params.ownerId });
    });

    app.use(errorHandler);
    return app;
  }

  describe('Demo Mode (AUTH_MODE=demo)', () => {
    it('accepts X-Demo-User-Id header and sets req.user accordingly', async () => {
      vi.spyOn(envModule, 'env', 'get').mockReturnValue({
        ...envModule.env,
        AUTH_MODE: 'demo'
      });

      const app = createTestAuthApp();
      const response = await request(app)
        .get('/protected')
        .set('x-demo-user-id', 'custom-student-99');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        uid: 'custom-student-99',
        email: 'custom-student-99@scholarpath.demo',
        mode: 'demo'
      });
    });

    it('falls back to default demo student when header is omitted in demo mode', async () => {
      vi.spyOn(envModule, 'env', 'get').mockReturnValue({
        ...envModule.env,
        AUTH_MODE: 'demo'
      });

      const app = createTestAuthApp();
      const response = await request(app).get('/protected');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        uid: 'demo-student-001',
        email: 'student@scholarpath.demo',
        mode: 'demo'
      });
    });

    it('enforces ownership checks: allows access when user matches owner', async () => {
      vi.spyOn(envModule, 'env', 'get').mockReturnValue({
        ...envModule.env,
        AUTH_MODE: 'demo'
      });

      const app = createTestAuthApp();
      const response = await request(app)
        .get('/protected/user-abc')
        .set('x-demo-user-id', 'user-abc');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('enforces ownership checks: forbids access when user does not match owner', async () => {
      vi.spyOn(envModule, 'env', 'get').mockReturnValue({
        ...envModule.env,
        AUTH_MODE: 'demo'
      });

      const app = createTestAuthApp();
      const response = await request(app)
        .get('/protected/user-target-secret')
        .set('x-demo-user-id', 'user-attacker');

      expect(response.status).toBe(403);
      expect(response.body.error).toMatchObject({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access or modify this resource'
      });
    });
  });

  describe('Production Mode (AUTH_MODE=production)', () => {
    it('strictly rejects X-Demo-User-Id in production mode', async () => {
      vi.spyOn(envModule, 'env', 'get').mockReturnValue({
        ...envModule.env,
        AUTH_MODE: 'production'
      });

      const app = createTestAuthApp();
      const response = await request(app)
        .get('/protected')
        .set('x-demo-user-id', 'some-demo-id');

      expect(response.status).toBe(401);
      expect(response.body.error).toMatchObject({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Demo authentication headers are not permitted in production mode'
      });
    });

    it('rejects requests without Authorization Bearer header in production mode', async () => {
      vi.spyOn(envModule, 'env', 'get').mockReturnValue({
        ...envModule.env,
        AUTH_MODE: 'production'
      });

      const app = createTestAuthApp();
      const response = await request(app).get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.error).toMatchObject({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authorization Bearer token is required'
      });
    });
  });
});
