import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import * as envModule from '../src/config/env';

describe('Document Metadata Endpoints (/documents)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects unauthenticated requests in production mode with 401', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'production'
    });

    const app = createApp();
    const getRes = await request(app).get('/documents');
    expect(getRes.status).toBe(401);

    const postRes = await request(app).post('/documents').send({ type: 'caste' });
    expect(postRes.status).toBe(401);

    const deleteRes = await request(app).delete('/documents/doc-123');
    expect(deleteRes.status).toBe(401);
  });

  it('creates document metadata for authenticated user in demo mode', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });

    const app = createApp();
    const docPayload = {
      type: 'income_certificate',
      issuer: 'Tahsildar Bangalore South',
      issuedOn: '2026-01-10',
      validUntil: '2027-01-09',
      notes: 'Valid for current academic session'
    };

    const response = await request(app)
      .post('/documents')
      .set('x-demo-user-id', 'user-doc-owner')
      .send(docPayload);

    expect(response.status).toBe(201);
    expect(response.body.document).toBeDefined();
    expect(response.body.document.userId).toBe('user-doc-owner');
    expect(response.body.document.type).toBe('income_certificate');
    expect(response.body.document.issuer).toBe('Tahsildar Bangalore South');
  });

  it('strictly rejects raw file payload in POST /documents with 400 VALIDATION_ERROR', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });

    const app = createApp();
    const invalidPayload = {
      type: 'income_certificate',
      issuer: 'Tahsildar',
      issuedOn: '2026-01-10',
      fileContent: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
    };

    const response = await request(app)
      .post('/documents')
      .set('x-demo-user-id', 'user-doc-owner')
      .send(invalidPayload);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(response.body.error)).toContain('Raw certificate files/payloads are strictly forbidden');
  });

  it('prevents User A from deleting User B document (returns 403 FORBIDDEN)', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });

    const app = createApp();

    // 1. User B creates a document
    const createRes = await request(app)
      .post('/documents')
      .set('x-demo-user-id', 'user-B')
      .send({
        type: 'caste_certificate',
        issuer: 'District Magistrate',
        issuedOn: '2025-06-01'
      });

    expect(createRes.status).toBe(201);
    const docId = createRes.body.document.id;

    // 2. User A attempts to delete User B's document
    const deleteRes = await request(app)
      .delete(`/documents/${docId}`)
      .set('x-demo-user-id', 'user-A');

    expect(deleteRes.status).toBe(403);
    expect(deleteRes.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 NOT_FOUND when attempting to delete non-existent document', async () => {
    vi.spyOn(envModule, 'env', 'get').mockReturnValue({
      ...envModule.env,
      AUTH_MODE: 'demo'
    });

    const app = createApp();
    const response = await request(app)
      .delete('/documents/non-existent-doc-999')
      .set('x-demo-user-id', 'user-A');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
