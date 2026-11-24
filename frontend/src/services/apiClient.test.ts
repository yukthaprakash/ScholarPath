import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient, ApiError } from './apiClient';
import { authService } from './authService';

// In-memory localStorage mock for node environment
const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, val: string) => storage.set(key, val),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('ApiClient', () => {
  let client: ApiClient;
  const originalFetch = global.fetch;

  beforeEach(() => {
    client = new ApiClient('http://localhost:3001/api/v1');
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('initializes with expected baseUrl', () => {
    expect(client.getBaseUrl()).toBe('http://localhost:3001/api/v1');
    client.setBaseUrl('http://api.example.com/api/v1/');
    expect(client.getBaseUrl()).toBe('http://api.example.com/api/v1');
  });

  it('injects fallback X-Demo-User-Id header when no authenticated user is logged in', async () => {
    let capturedHeaders: Headers | undefined;
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedHeaders = new Headers(init.headers);
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true }),
      });
    });

    await client.get('/test');
    expect(capturedHeaders?.get('X-Demo-User-Id')).toBe('demo-student-001');
    expect(capturedHeaders?.get('Accept')).toBe('application/json');
  });

  it('injects authenticated user ID as X-Demo-User-Id header', async () => {
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      id: 'usr_custom_123',
      name: 'Vraj',
      email: 'vraj@example.com',
      profileCompleted: true,
      createdAt: '2026-10-01',
    });

    let capturedHeaders: Headers | undefined;
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedHeaders = new Headers(init.headers);
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true }),
      });
    });

    await client.get('/test');
    expect(capturedHeaders?.get('X-Demo-User-Id')).toBe('usr_custom_123');
  });

  it('does not send X-Demo-User-Id header when VITE_ENABLE_DEMO_MODE is explicitly false', async () => {
    vi.stubEnv('VITE_ENABLE_DEMO_MODE', 'false');

    let capturedHeaders: Headers | undefined;
    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedHeaders = new Headers(init.headers);
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ success: true }),
      });
    });

    await client.get('/test');
    expect(capturedHeaders?.has('X-Demo-User-Id')).toBe(false);
    vi.unstubAllEnvs();
  });

  it('appends query string parameters correctly to the URL', async () => {
    let capturedUrl: string | undefined;
    global.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: [] }),
      });
    });

    await client.get('/schemes', { q: 'merit', page: 2, limit: 10, empty: '' });
    expect(capturedUrl).toContain('http://localhost:3001/api/v1/schemes?');
    expect(capturedUrl).toContain('q=merit');
    expect(capturedUrl).toContain('page=2');
    expect(capturedUrl).toContain('limit=10');
    expect(capturedUrl).not.toContain('empty=');
  });

  it('parses standardized backend error response envelopes into ApiError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({
        'content-type': 'application/json',
        'x-request-id': 'req-abc-123',
      }),
      json: () =>
        Promise.resolve({
          error: {
            code: 'SCHEME_NOT_FOUND',
            message: 'Scheme with slug post-matric not found',
            requestId: 'req-abc-123',
          },
        }),
    });

    await expect(client.get('/schemes/post-matric')).rejects.toThrow(ApiError);

    try {
      await client.get('/schemes/post-matric');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.code).toBe('SCHEME_NOT_FOUND');
      expect(apiErr.message).toBe('Scheme with slug post-matric not found');
      expect(apiErr.requestId).toBe('req-abc-123');
    }
  });

  it('handles network failure by throwing typed NETWORK_UNAVAILABLE ApiError', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(client.get('/schemes')).rejects.toThrow(ApiError);

    try {
      await client.get('/schemes');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(0);
      expect(apiErr.code).toBe('NETWORK_UNAVAILABLE');
      expect(apiErr.message).toContain('Unable to connect to backend server');
    }
  });

  it('sends JSON body in POST and PUT requests with Content-Type header', async () => {
    let capturedBody: string | undefined;
    let capturedMethod: string | undefined;

    global.fetch = vi.fn().mockImplementation((_url, init) => {
      capturedBody = init.body;
      capturedMethod = init.method;
      return Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ updated: true }),
      });
    });

    await client.post('/eligibility/evaluate', { schemeSlug: 'nsp-central' });
    expect(capturedMethod).toBe('POST');
    expect(JSON.parse(capturedBody!)).toEqual({ schemeSlug: 'nsp-central' });

    await client.put('/profile', { fullName: 'Saksham' });
    expect(capturedMethod).toBe('PUT');
    expect(JSON.parse(capturedBody!)).toEqual({ fullName: 'Saksham' });
  });
});
