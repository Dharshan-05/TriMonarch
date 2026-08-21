import { describe, it, expect } from 'vitest';
import { methodGuard } from '../../../src/middleware/methodGuard';
import { contentTypeGuard } from '../../../src/middleware/contentTypeGuard';
import { parameterPollutionGuard } from '../../../src/middleware/requestLimits';
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/testHelpers';
import {
  MethodNotAllowedError,
  UnsupportedMediaTypeError,
  ParameterPollutionError,
} from '../../../src/types';

describe('Phase 061 — Express Middleware Unit Tests', () => {
  describe('methodGuard', () => {
    it('should allow GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD methods', () => {
      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) {
        const req = createMockRequest({ method });
        const { res } = createMockResponse();
        const next = createMockNext();

        methodGuard(req, res, next);
        expect(next).toHaveBeenCalledWith();
      }
    });

    it('should pass MethodNotAllowedError to next() for TRACE method', () => {
      const req = createMockRequest({ method: 'TRACE' });
      const { res } = createMockResponse();
      const next = createMockNext();

      methodGuard(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(MethodNotAllowedError));
    });
  });

  describe('contentTypeGuard', () => {
    it('should allow POST request with application/json Content-Type', () => {
      const req = createMockRequest({
        method: 'POST',
        headers: { 'content-type': 'application/json', 'content-length': '10' },
      });
      const { res } = createMockResponse();
      const next = createMockNext();

      contentTypeGuard(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject POST request with text/html Content-Type', () => {
      const req = createMockRequest({
        method: 'POST',
        headers: { 'content-type': 'text/html', 'content-length': '20' },
      });
      const { res } = createMockResponse();
      const next = createMockNext();

      contentTypeGuard(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(UnsupportedMediaTypeError));
    });
  });

  describe('parameterPollutionGuard', () => {
    it('should pass clean query parameters', () => {
      const req = createMockRequest({ query: { page: '1', limit: '10' } });
      const { res } = createMockResponse();
      const next = createMockNext();

      parameterPollutionGuard(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject duplicate array query parameters for sensitive keys like page', () => {
      const req = createMockRequest({ query: { page: ['1', '9999'] as unknown as string } });
      const { res } = createMockResponse();
      const next = createMockNext();

      parameterPollutionGuard(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(ParameterPollutionError));
    });
  });
});
