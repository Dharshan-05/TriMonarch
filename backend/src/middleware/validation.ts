import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validateRequest = (schemas: RequestValidationSchemas) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as Record<string, string>;
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as unknown as Request['query'];
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
