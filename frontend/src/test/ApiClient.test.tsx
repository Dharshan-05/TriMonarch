import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { AxiosError } from 'axios';
import { ApiResponse } from '@/types/api';

describe('HttpClient & Error Normalization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes HTTP 400/422 validation errors correctly', () => {
    const mockAxiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        headers: { 'x-request-id': 'req-val-123' },
        data: {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Invalid input fields',
            details: [{ field: 'sku', message: 'SKU is required' }],
          },
        },
      },
    } as unknown as AxiosError<ApiResponse<unknown>>;

    const normalized = apiClient.handleAxiosError(mockAxiosError);
    expect(normalized).toBeInstanceOf(ApiError);
    expect(normalized.category).toBe('VALIDATION_ERROR');
    expect(normalized.status).toBe(400);
    expect(normalized.code).toBe('VALIDATION_FAILED');
    expect(normalized.requestId).toBe('req-val-123');
  });

  it('normalizes HTTP 401 unauthenticated error', () => {
    const mockAxiosError = {
      isAxiosError: true,
      response: {
        status: 401,
        headers: {},
        data: {
          success: false,
          error: { code: 'UNAUTHORIZED_ACCESS', message: 'Token expired' },
        },
      },
    } as unknown as AxiosError<ApiResponse<unknown>>;

    const normalized = apiClient.handleAxiosError(mockAxiosError);
    expect(normalized.category).toBe('UNAUTHENTICATED');
    expect(normalized.status).toBe(401);
  });

  it('normalizes network connectivity errors correctly', () => {
    const mockAxiosError = {
      isAxiosError: true,
      request: {},
      message: 'Network Error',
    } as unknown as AxiosError<ApiResponse<unknown>>;

    const normalized = apiClient.handleAxiosError(mockAxiosError);
    expect(normalized.category).toBe('NETWORK_ERROR');
    expect(normalized.status).toBe(0);
    expect(normalized.message).toContain('Network error');
  });

  it('normalizes timeout errors correctly', () => {
    const mockAxiosError = {
      isAxiosError: true,
      code: 'ECONNABORTED',
      message: 'timeout of 15000ms exceeded',
    } as unknown as AxiosError<ApiResponse<unknown>>;

    const normalized = apiClient.handleAxiosError(mockAxiosError);
    expect(normalized.category).toBe('TIMEOUT_ERROR');
    expect(normalized.status).toBe(408);
  });
});
