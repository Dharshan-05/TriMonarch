import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, InvalidTokenError } from '../utils/jwt';
import { AuthenticationRequiredError } from '../errors/authentication.errors';
import { AuthContext } from '../types/auth';

export { AuthContext };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export const requireAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AuthenticationRequiredError('Authorization header is required');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      throw new InvalidTokenError('Authorization header must follow Bearer <token> format');
    }

    const token = parts[1];
    const decoded = await verifyAccessToken(token);

    if (!decoded || !decoded.sub || !decoded.organizationId) {
      throw new InvalidTokenError('Invalid token payload: missing sub or organizationId');
    }

    req.auth = {
      userId: decoded.sub,
      organizationId: decoded.organizationId,
      jti: decoded.jti,
    };

    next();
  } catch (error) {
    next(error);
  }
};
