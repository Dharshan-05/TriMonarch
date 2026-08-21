import { Response } from 'express';
import { ApiSuccessResponse, ApiPaginatedResponse, PaginationMeta } from '../types/apiResponse';

const SENSITIVE_RESPONSE_KEYS = new Set([
  'password',
  'passwordhash',
  'accesstoken',
  'refreshtoken',
  'secret',
  'databasepassword',
  'apikey',
]);

export const sanitizeResponseData = <T>(data: T): T => {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeResponseData(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_RESPONSE_KEYS.has(key.toLowerCase())) {
      continue; // Omit sensitive properties from DTO responses
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeResponseData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
};

export const sendSuccess = <T>(
  res: Response,
  data: T,
  meta?: Record<string, unknown>,
  statusCode = 200,
): Response => {
  const requestId = (res.req as { id?: string })?.id;
  const sanitizedData = sanitizeResponseData(data);

  const responseBody: ApiSuccessResponse<T> = {
    success: true,
    data: sanitizedData,
    meta: {
      ...(requestId && { requestId }),
      apiVersion: 'v1',
      ...meta,
    },
  };

  return res.status(statusCode).json(responseBody);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  location?: string,
  meta?: Record<string, unknown>,
): Response => {
  if (location) {
    res.setHeader('Location', location);
  }
  return sendSuccess(res, data, meta, 201);
};

export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

export const sendPaginated = <T>(
  res: Response,
  items: T[],
  page: number,
  pageSize: number,
  totalItems: number,
  extraMeta?: Record<string, unknown>,
): Response => {
  const requestId = (res.req as { id?: string })?.id;
  const sanitizedItems = sanitizeResponseData(items) || [];

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1 && totalPages > 0;

  const paginationMeta: PaginationMeta = {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };

  const responseBody: ApiPaginatedResponse<T> = {
    success: true,
    data: sanitizedItems,
    meta: {
      ...(requestId && { requestId }),
      apiVersion: 'v1',
      page,
      pageSize,
      total: totalItems,
      totalPages,
      pagination: paginationMeta,
      ...extraMeta,
    },
  };

  return res.status(200).json(responseBody);
};
