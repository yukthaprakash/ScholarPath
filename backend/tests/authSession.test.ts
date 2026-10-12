import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import * as envModule from '../src/config/env';

describe('POST /auth/session', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully creates session in demo mode with X-Demo-User-Id', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });

    const app = createApp();
    const response = await request(app)
      .post('/auth/session')
      .set('x-demo-user-id', 'demo-user-123');

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.id).toBe('demo-user-123');
    expect(response.body.user.authMode).toBe('demo');
  });

  it('successfully creates session with default user when X-Demo-User-Id is omitted in demo mode', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });

    const app = createApp();
    const response = await request(app).post('/auth/session');

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe('demo-student-001');
    expect(response.body.user.authMode).toBe('demo');
  });

  it('strictly rejects X-Demo-User-Id header when AUTH_MODE=production', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'production'
    });

    const app = createApp();
    const response = await request(app)
      .post('/auth/session')
      .set('x-demo-user-id', 'attacker-demo-id');

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    expect(response.body.error.message).toContain('Demo authentication headers are not permitted in production mode');
  });
});
