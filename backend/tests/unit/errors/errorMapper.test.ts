import { describe, it, expect } from 'vitest';
import { mapErrorToResponse } from '../../../src/errors/errorMapper';
import {
  ValidationError,
  NotFoundError,
  MethodNotAllowedError,
  UnsupportedMediaTypeError,
  PayloadTooLargeError,
  TooManyRequestsError,
} from '../../../src/types';
import { DuplicateKeyError } from '../../../src/db/errors';

describe('Phase 061 — Error Mapping & Sanitization Unit Tests', () => {
  it('mapErrorToResponse should map ValidationError to 400 VALIDATION_ERROR', () => {
    const error = new ValidationError('Invalid request body parameter');
    const result = mapErrorToResponse(error);

    expect(result.statusCode).toBe(400);
    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('Invalid request body parameter');
  });

  it('mapErrorToResponse should map NotFoundError to 404 NOT_FOUND', () => {
    const error = new NotFoundError('Resource not found');
    const result = mapErrorToResponse(error);

    expect(result.statusCode).toBe(404);
    expect(result.code).toBe('NOT_FOUND');
  });

  it('mapErrorToResponse should map DuplicateKeyError to 409 DUPLICATE_KEY_VIOLATION', () => {
    const error = new DuplicateKeyError('Resource already exists');
    const result = mapErrorToResponse(error);

    expect(result.statusCode).toBe(409);
    expect(result.code).toBe('DUPLICATE_KEY_VIOLATION');
  });

  it('mapErrorToResponse should map MethodNotAllowedError to 405 METHOD_NOT_ALLOWED', () => {
    const error = new MethodNotAllowedError();
    const result = mapErrorToResponse(error);

    expect(result.statusCode).toBe(405);
    expect(result.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('mapErrorToResponse should map UnsupportedMediaTypeError to 415 UNSUPPORTED_MEDIA_TYPE', () => {
    const error = new UnsupportedMediaTypeError();
    const result = mapErrorToResponse(error);

    expect(result.statusCode).toBe(415);
    expect(result.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('mapErrorToResponse should map PayloadTooLargeError to 413 PAYLOAD_TOO_LARGE', () => {
    const error = new PayloadTooLargeError();
    const result = mapErrorToResponse(error);

    expect(result.statusCode).toBe(413);
    expect(result.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('mapErrorToResponse should map TooManyRequestsError to 429 TOO_MANY_REQUESTS', () => {
    const error = new TooManyRequestsError();
    const result = mapErrorToResponse(error);

    expect(result.statusCode).toBe(429);
    expect(result.code).toBe('TOO_MANY_REQUESTS');
  });

  it('mapErrorToResponse should map PostgreSQL 23505 unique violation code to 409 DUPLICATE_RESOURCE', () => {
    const pgError = { code: '23505', detail: 'Key (email)=(test@example.com) already exists.' };
    const result = mapErrorToResponse(pgError);

    expect(result.statusCode).toBe(409);
    expect(result.code).toBe('DUPLICATE_RESOURCE');
  });
});
