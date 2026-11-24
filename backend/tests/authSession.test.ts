import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import * as envModule from '../src/config/env';
import * as dbModule from '../src/db';
import { upsertUser } from '../src/services/userService';

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

describe('upsertUser - authMode and email preservation', () => {
  describe('In-Memory Fallback Implementation', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValue(false);
    });

    it('new user without authMode gets demo', async () => {
      const user = await upsertUser('inmem-new-student-1');
      expect(user.id).toBe('inmem-new-student-1');
      expect(user.authMode).toBe('demo');
      expect(user.email).toBeUndefined();
    });

    it('existing Firebase user remains Firebase when upsertUser(id) is called', async () => {
      const initial = await upsertUser('inmem-fb-user-1', 'firebase.student@scholarpath.org', 'firebase');
      expect(initial.authMode).toBe('firebase');

      // Call upsertUser with only id (authMode and email omitted)
      const preserved = await upsertUser('inmem-fb-user-1');
      expect(preserved.id).toBe('inmem-fb-user-1');
      expect(preserved.authMode).toBe('firebase');
      expect(preserved.email).toBe('firebase.student@scholarpath.org');
    });

    it('existing email remains unchanged when omitted on update', async () => {
      await upsertUser('inmem-email-user-1', 'original@scholarpath.org', 'demo');

      // Call upsertUser without email
      const updated = await upsertUser('inmem-email-user-1');
      expect(updated.email).toBe('original@scholarpath.org');
      expect(updated.authMode).toBe('demo');
    });

    it('explicitly supplied authMode updates the existing value', async () => {
      await upsertUser('inmem-upgrade-user-1', 'student@scholarpath.org', 'demo');

      // Explicitly upgrade authMode to firebase
      const upgraded = await upsertUser('inmem-upgrade-user-1', undefined, 'firebase');
      expect(upgraded.authMode).toBe('firebase');
      expect(upgraded.email).toBe('student@scholarpath.org');
    });
  });

  describe('PostgreSQL Database Implementation', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValue(true);
    });

    it('binds null for omitted authMode/email and uses proper COALESCE in SQL', async () => {
      let executedSql = '';
      let executedParams: unknown[] = [];

      vi.spyOn(dbModule, 'query').mockImplementation(async (sql: string, params?: unknown[]) => {
        executedSql = sql;
        executedParams = params ?? [];
        return {
          rows: [{
            id: params?.[0] as string,
            email: undefined,
            authMode: 'demo',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }],
          rowCount: 1,
          command: 'INSERT',
          oid: 0,
          fields: []
        };
      });

      const user = await upsertUser('pg-new-user-1');
      expect(user.authMode).toBe('demo');
      // Verifies omission passes null for $2 and $3 rather than hardcoding 'demo'
      expect(executedParams).toEqual(['pg-new-user-1', null, null]);
      // Verifies SQL statement defaults to 'demo' on INSERT and preserves users.auth_mode on UPDATE
      expect(executedSql).toContain("COALESCE($3, 'demo')");
      expect(executedSql).toContain('auth_mode = COALESCE($3, users.auth_mode)');
      expect(executedSql).toContain('email = COALESCE(EXCLUDED.email, users.email)');
    });

    it('preserves Firebase authMode and email on update, and updates when explicitly supplied', async () => {
      // Mock simulating PostgreSQL table storage with ON CONFLICT DO UPDATE behavior
      const mockDatabase = new Map<string, { id: string; email: string | null; auth_mode: string }>();
      mockDatabase.set('pg-fb-user-1', {
        id: 'pg-fb-user-1',
        email: 'firebase-user@scholarpath.org',
        auth_mode: 'firebase'
      });

      vi.spyOn(dbModule, 'query').mockImplementation(async (sql: string, params?: unknown[]) => {
        const [id, email, authMode] = params as [string, string | null, string | null];
        const existing = mockDatabase.get(id);

        let finalEmail: string | null;
        let finalAuthMode: string;

        if (existing) {
          // SQL behavior: SET email = COALESCE(EXCLUDED.email, users.email), auth_mode = COALESCE($3, users.auth_mode)
          finalEmail = email !== null ? email : existing.email;
          finalAuthMode = authMode !== null ? authMode : existing.auth_mode;
        } else {
          // SQL behavior: VALUES ($1, $2, COALESCE($3, 'demo'), NOW())
          finalEmail = email;
          finalAuthMode = authMode !== null ? authMode : 'demo';
        }

        const row = { id, email: finalEmail, auth_mode: finalAuthMode };
        mockDatabase.set(id, row);

        return {
          rows: [{
            id: row.id,
            email: row.email ?? undefined,
            authMode: row.auth_mode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }],
          rowCount: 1,
          command: 'INSERT',
          oid: 0,
          fields: []
        };
      });

      // 1. Existing Firebase user remains Firebase when upsertUser(id) is called
      const preserved = await upsertUser('pg-fb-user-1');
      expect(preserved.authMode).toBe('firebase');
      expect(preserved.email).toBe('firebase-user@scholarpath.org');

      // 2. Explicitly supplied authMode updates the existing value
      const updated = await upsertUser('pg-fb-user-1', undefined, 'custom-auth-provider');
      expect(updated.authMode).toBe('custom-auth-provider');
      expect(updated.email).toBe('firebase-user@scholarpath.org');

      // 3. New user without authMode gets demo
      const newUser = await upsertUser('pg-new-user-2');
      expect(newUser.authMode).toBe('demo');
    });
  });
});
