import { Request, Response, NextFunction } from 'express';
import { vi } from 'vitest';

export const createMockRequest = (overrides?: Partial<Request>): Request => {
  const req = {
    headers: {},
    query: {},
    params: {},
    body: {},
    method: 'GET',
    url: '/',
    id: 'test-req-id-123',
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    ...overrides,
  } as unknown as Request;
  return req;
};

export const createMockResponse = (): { res: Response; jsonSpy: ReturnType<typeof vi.fn>; statusSpy: ReturnType<typeof vi.fn>; sendSpy: ReturnType<typeof vi.fn>; setHeaderSpy: ReturnType<typeof vi.fn> } => {
  const jsonSpy = vi.fn();
  const statusSpy = vi.fn();
  const sendSpy = vi.fn();
  const setHeaderSpy = vi.fn();

  const res = {
    status: (code: number) => {
      statusSpy(code);
      return res;
    },
    json: (body: unknown) => {
      jsonSpy(body);
      return res;
    },
    send: (body?: unknown) => {
      sendSpy(body);
      return res;
    },
    setHeader: (name: string, value: string) => {
      setHeaderSpy(name, value);
      return res;
    },
    req: { id: 'test-req-id-123' },
  } as unknown as Response;

  return { res, jsonSpy, statusSpy, sendSpy, setHeaderSpy };
};

export const createMockNext = (): NextFunction & ReturnType<typeof vi.fn> => {
  return vi.fn() as unknown as NextFunction & ReturnType<typeof vi.fn>;
};
