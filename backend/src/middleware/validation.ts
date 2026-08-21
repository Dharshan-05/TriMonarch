import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../types';
import { isPrototypePollutionKey } from './requestLimits';

export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}

export const validateRequest = (schemas: RequestValidationSchemas) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.body && isPrototypePollutionKey(req.body)) {
        throw new ValidationError('Potential prototype pollution detected in request body');
      }

      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as Record<string, string>;
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as unknown as Request['query'];
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.headers) {
        await schemas.headers.parseAsync(req.headers);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
