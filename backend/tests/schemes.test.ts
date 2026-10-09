import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Scheme Endpoints (/schemes, /schemes/:slug)', () => {
  const app = createApp();

  it('lists schemes with pagination metadata', async () => {
    const response = await request(app).get('/schemes?page=1&limit=5');

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 5
    });
  });

  it('filters schemes by search term', async () => {
    const response = await request(app).get('/schemes?q=OBC');

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].slug).toContain('obc');
  });

  it('filters schemes by scope and type', async () => {
    const response = await request(app).get('/schemes?scope=central&type=scholarship');

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
    for (const scheme of response.body.data) {
      expect(scheme.scope).toBe('central');
      expect(scheme.type).toBe('scholarship');
    }
  });

  it('retrieves scheme details by valid slug', async () => {
    const response = await request(app).get('/schemes/post-matric-scholarship-obc');

    expect(response.status).toBe(200);
    expect(response.body.scheme).toBeDefined();
    expect(response.body.scheme.slug).toBe('post-matric-scholarship-obc');
    expect(response.body.scheme.title).toContain('Post-Matric');
    expect(response.body.scheme.rules).toBeInstanceOf(Array);
    expect(response.body.scheme.requiredDocuments).toBeInstanceOf(Array);
    expect(response.body.scheme.trustData).toBeDefined();
  });

  it('returns 404 NOT_FOUND for non-existent scheme slug', async () => {
    const response = await request(app).get('/schemes/non-existent-scheme-slug-999');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toContain('not found');
  });

  it('returns 400 VALIDATION_ERROR for invalid scope query parameter', async () => {
    const response = await request(app).get('/schemes?scope=invalid_scope');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
