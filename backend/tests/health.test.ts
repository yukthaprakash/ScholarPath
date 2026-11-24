import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import * as dbModule from '../src/db';
import { createApp } from '../src/app';

describe('GET /health', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.restoreAllMocks();
    app = createApp();
  });

  it('returns 200 and healthy status when database is reachable', async () => {
    vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValue(true);

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      database: 'ok'
    });
    expect(response.body.requestId).toBeDefined();
    expect(response.headers['x-request-id']).toBe(response.body.requestId);
  });

  it('returns 503 and error envelope when database connectivity fails', async () => {
    vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValue(false);

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database connectivity check failed',
        details: {
          database: 'unavailable'
        }
      }
    });
    expect(response.body.error.requestId).toBeDefined();
    expect(response.headers['x-request-id']).toBe(response.body.error.requestId);
  });

  it('preserves an incoming valid x-request-id header', async () => {
    vi.spyOn(dbModule, 'checkDatabaseHealth').mockResolvedValue(true);
    const customRequestId = 'test-client-trace-12345';

    const response = await request(app)
      .get('/health')
      .set('x-request-id', customRequestId);

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe(customRequestId);
    expect(response.body.requestId).toBe(customRequestId);
  });
});
