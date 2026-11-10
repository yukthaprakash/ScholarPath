import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Malformed Request Handling', () => {
  const app = createApp();

  it('returns 400 INVALID_JSON when receiving malformed JSON payload', async () => {
    const response = await request(app)
      .post('/auth/session')
      .set('Content-Type', 'application/json')
      .send('{ malformed: json, missingQuotes: true ');

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('INVALID_JSON');
    expect(response.body.error.message).toContain('malformed JSON syntax');
  });
});
