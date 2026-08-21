import { Request, Response, NextFunction } from 'express';
import { ParameterPollutionError, PayloadTooLargeError, ValidationError } from '../types';
import { env } from '../config/env';

const SENSITIVE_SINGLE_QUERY_PARAMS = new Set([
  'page',
  'pagesize',
  'limit',
  'sortby',
  'sortorder',
  'role',
  'status',
  'userid',
  'organizationid',
  'category',
  'type',
  'search',
]);

export const isPrototypePollutionKey = (obj: unknown): boolean => {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  const proto = Object.getPrototypeOf(obj);
  if (proto !== null && proto !== Object.prototype && proto !== Array.prototype) {
    return true;
  }

  if (
    Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
    Object.prototype.hasOwnProperty.call(obj, 'constructor') ||
    Object.prototype.hasOwnProperty.call(obj, 'prototype')
  ) {
    return true;
  }

  const keys = Object.keys(obj as Record<string, unknown>);
  for (const key of keys) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return true;
    }
    const val = (obj as Record<string, unknown>)[key];
    if (typeof val === 'object' && val !== null && isPrototypePollutionKey(val)) {
      return true;
    }
  }

  return false;
};

export const parameterPollutionGuard = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.query && typeof req.query === 'object') {
    const keys = Object.keys(req.query);

    if (keys.length > (env.QUERY_PARAMETER_LIMIT || 100)) {
      next(new PayloadTooLargeError(`Query parameter count exceeds maximum limit of ${env.QUERY_PARAMETER_LIMIT || 100}`));
      return;
    }

    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      const val = req.query[key];

      if (SENSITIVE_SINGLE_QUERY_PARAMS.has(lowerKey) && Array.isArray(val)) {
        next(new ParameterPollutionError(`HTTP parameter pollution detected: duplicate array value for parameter '${key}' is prohibited`));
        return;
      }

      if (typeof val === 'string' && val.length > 2048) {
        next(new PayloadTooLargeError(`Query parameter '${key}' value exceeds maximum permitted length of 2048 characters`));
        return;
      }
    }
  }

  if (req.body && isPrototypePollutionKey(req.body)) {
    next(new ValidationError('Potential prototype pollution detected in request body'));
    return;
  }

  next();
};
