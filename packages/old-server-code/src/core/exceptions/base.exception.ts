/**
 * Base Exception Classes
 * Provides structured error handling across the application
 */

export class BaseException extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }
}

export class BusinessException extends BaseException {
  constructor(message: string, code: string = 'BUSINESS_ERROR', details?: any) {
    super(message, 400, code, details);
  }
}

export class ValidationException extends BaseException {
  constructor(message: string, errors?: any) {
    super(message, 422, 'VALIDATION_ERROR', errors);
  }
}

export class AuthenticationException extends BaseException {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationException extends BaseException {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class UnauthorizedException extends BaseException {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED_ERROR');
  }
}

export class NotFoundException extends BaseException {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictException extends BaseException {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class RateLimitException extends BaseException {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class ExternalServiceException extends BaseException {
  constructor(service: string, message: string, details?: any) {
    super(`External service error (${service}): ${message}`, 503, 'EXTERNAL_SERVICE_ERROR', details);
  }
}