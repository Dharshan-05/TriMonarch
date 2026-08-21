import { describe, it, expect } from 'vitest';
import {
  sendSuccess,
  sendCreated,
  sendNoContent,
  sendPaginated,
  sanitizeResponseData,
} from '../../../src/utils/response';
import { createMockResponse } from '../helpers/testHelpers';

describe('Phase 061 — Response Serializer & Sanitizer Unit Tests', () => {
  describe('sanitizeResponseData', () => {
    it('should strip password, passwordHash, accessToken, refreshToken, secret, and apiKey', () => {
      const data = {
        id: '123',
        name: 'Test Object',
        password: 'plain_password',
        passwordHash: 'hashed_password',
        accessToken: 'access_jwt',
        refreshToken: 'refresh_jwt',
        secret: 'super_secret',
        apiKey: 'key_123',
        nested: {
          secret: 'nested_secret',
          value: 'safe_value',
        },
      };

      const sanitized = sanitizeResponseData(data);
      expect(sanitized).toEqual({
        id: '123',
        name: 'Test Object',
        nested: {
          value: 'safe_value',
        },
      });
      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('passwordHash');
      expect(sanitized).not.toHaveProperty('accessToken');
    });

    it('should sanitize array of objects', () => {
      const list = [{ id: 1, secret: 's1' }, { id: 2, secret: 's2' }];
      const sanitized = sanitizeResponseData(list);
      expect(sanitized).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('Response Serializer Helpers', () => {
    it('sendSuccess should set status 200 and return standard success payload', () => {
      const { res, jsonSpy, statusSpy } = createMockResponse();
      sendSuccess(res, { foo: 'bar' });

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { foo: 'bar' },
        meta: {
          requestId: 'test-req-id-123',
          apiVersion: 'v1',
        },
      });
    });

    it('sendCreated should set status 201 and Location header if provided', () => {
      const { res, jsonSpy, statusSpy, setHeaderSpy } = createMockResponse();
      sendCreated(res, { id: 'new-1' }, '/api/v1/items/new-1');

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(setHeaderSpy).toHaveBeenCalledWith('Location', '/api/v1/items/new-1');
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: { id: 'new-1' },
        meta: {
          requestId: 'test-req-id-123',
          apiVersion: 'v1',
        },
      });
    });

    it('sendNoContent should set status 204 with empty response', () => {
      const { res, statusSpy, sendSpy } = createMockResponse();
      sendNoContent(res);

      expect(statusSpy).toHaveBeenCalledWith(204);
      expect(sendSpy).toHaveBeenCalled();
    });

    it('sendPaginated should calculate pagination flags and return 200', () => {
      const { res, jsonSpy, statusSpy } = createMockResponse();
      sendPaginated(res, [{ id: 1 }], 1, 10, 25);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1 }],
        meta: {
          requestId: 'test-req-id-123',
          apiVersion: 'v1',
          page: 1,
          pageSize: 10,
          total: 25,
          totalPages: 3,
          pagination: {
            page: 1,
            pageSize: 10,
            totalItems: 25,
            totalPages: 3,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      });
    });
  });
});
