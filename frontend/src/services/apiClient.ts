import { authService } from './authService';

export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
    requestId?: string;
  };
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;
  public requestId?: string;

  constructor(status: number, message: string, code: string = 'API_ERROR', details?: unknown, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Priority: Explicit argument > import.meta.env > default backend port 3001
    const envBaseUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL;
    this.baseUrl = (baseUrl || envBaseUrl || 'http://localhost:3001/api/v1').replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  /**
   * Build complete URL with query string parameters
   */
  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${cleanPath}`);

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          url.searchParams.append(key, String(val));
        }
      });
    }

    return url.toString();
  }

  /**
   * Core request dispatcher with automatic headers, demo identity injection, and typed error handling
   */
  public async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.params);
    const headers = new Headers(options.headers || {});

    // Ensure JSON accept & content-type headers by default unless already set
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Attach demo identity only when demo mode is enabled
    const isDemoMode = import.meta.env?.VITE_ENABLE_DEMO_MODE !== 'false';
    if (isDemoMode) {
      const currentUser = authService.getCurrentUser();
      if (currentUser?.id) {
        if (!headers.has('X-Demo-User-Id')) {
          headers.set('X-Demo-User-Id', currentUser.id);
        }
      } else {
        // Default fallback demo identity for seamless local testing
        if (!headers.has('X-Demo-User-Id')) {
          headers.set('X-Demo-User-Id', 'demo-student-001');
        }
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Parse JSON payload or handle empty body
      let data: unknown = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        const text = await response.text();
        data = text ? { raw: text } : null;
      }

      if (!response.ok) {
        const errPayload = data as ApiErrorResponse | null;
        const status = response.status;
        const code = errPayload?.error?.code || this.statusToCode(status);
        const message = errPayload?.error?.message || response.statusText || `Request failed with status ${status}`;
        const details = errPayload?.error?.details;
        const requestId = errPayload?.error?.requestId || response.headers.get('x-request-id') || undefined;

        throw new ApiError(status, message, code, details, requestId);
      }

      return data as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }

      // Network unreachable, DNS failure, CORS blocked, or server connection refused
      const isNetworkError = err instanceof TypeError && (
        err.message.includes('fetch') ||
        err.message.includes('Failed to fetch') ||
        err.message.includes('NetworkError') ||
        err.message.includes('network')
      );

      if (isNetworkError) {
        throw new ApiError(
          0,
          `Unable to connect to backend server at ${this.baseUrl}. Please verify the backend is running.`,
          'NETWORK_UNAVAILABLE',
          { originalError: String(err) }
        );
      }

      throw new ApiError(
        500,
        err instanceof Error ? err.message : 'An unknown API error occurred',
        'UNKNOWN_ERROR',
        { originalError: String(err) }
      );
    }
  }

  private statusToCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'API_ERROR';
    }
  }

  public get<T>(path: string, params?: Record<string, string | number | boolean | undefined | null>, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET', params });
  }

  public post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
