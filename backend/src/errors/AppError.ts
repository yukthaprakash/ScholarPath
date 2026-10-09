export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid input parameters', details: Record<string, unknown> = {}) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details: Record<string, unknown> = {}) {
    super(message, 401, 'AUTHENTICATION_REQUIRED', details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden', details: Record<string, unknown> = {}) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details: Record<string, unknown> = {}) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class RateLimitExceededError extends AppError {
  constructor(message = 'Too many requests, please try again later', details: Record<string, unknown> = {}) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', details: Record<string, unknown> = {}) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}
