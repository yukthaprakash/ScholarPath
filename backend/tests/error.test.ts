import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Centralized Error Handling & Request IDs', () => {
  const app = createApp();

  it('handles malformed JSON syntax and returns 400 with INVALID_JSON', async () => {
    const response = await request(app)
      .post('/health')
      .set('Content-Type', 'application/json')
      .send('{"brokenJson: 123');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatchObject({
      code: 'INVALID_JSON',
      message: 'The request body contains malformed JSON syntax',
      details: {}
    });
    expect(response.body.error.requestId).toBeDefined();
    expect(response.headers['x-request-id']).toBe(response.body.error.requestId);
  });

  it('handles undefined routes and returns 404 with NOT_FOUND', async () => {
    const response = await request(app).get('/api/v1/nonexistent-route');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'The requested API route does not exist',
      details: {}
    });
    expect(response.body.error.requestId).toBeDefined();
  });

  it('ensures every error response strictly conforms to the standard error envelope', async () => {
    const response = await request(app).get('/some-invalid-endpoint');

    expect(response.body).toHaveProperty('error');
    const { error } = response.body;

    expect(typeof error.code).toBe('string');
    expect(typeof error.message).toBe('string');
    expect(typeof error.details).toBe('object');
    expect(typeof error.requestId).toBe('string');
    expect(error.stack).toBeUndefined(); // Stack traces must NEVER be exposed
  });
});
