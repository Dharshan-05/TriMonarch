import { Request, Response, NextFunction } from 'express';
import { UnsupportedMediaTypeError } from '../types';

export const contentTypeGuard = (req: Request, _res: Response, next: NextFunction): void => {
  const method = req.method.toUpperCase();
  if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    const contentType = req.headers['content-type'];
    const contentLength = req.headers['content-length'];

    // Only enforce content-type check if request body or content-type header is present
    if (contentType || (contentLength && parseInt(contentLength, 10) > 0)) {
      if (
        !contentType ||
        (!contentType.includes('application/json') &&
          !contentType.includes('application/x-www-form-urlencoded') &&
          !contentType.includes('multipart/form-data'))
      ) {
        next(new UnsupportedMediaTypeError(`Content-Type '${contentType || 'none'}' is not supported. Expected 'application/json'`));
        return;
      }
    }
  }
  next();
};
